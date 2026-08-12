import { getGeminiClient } from "../gemini/gemini.client.js";
import type { GeminiInsightConfig } from "../gemini/gemini.config.js";
import type {
  InsightCandidate,
  ReportPeriodType,
} from "../calculator/insight.types.js";
import {
  createInsightPrompt,
  INSIGHT_SYSTEM_PROMPT,
} from "../prompt/insight.prompt.js";
import { validateAiInsightContent } from "../validator/insight.validator.js";
import type { InsightGenerationError } from "./insight-generation.types.js";

interface AiGenerationSuccess {
  content: string;
  error: null;
}

interface AiGenerationFailure {
  content: null;
  error: InsightGenerationError;
}

export type AiGenerationResult = AiGenerationSuccess | AiGenerationFailure;

const responseSchema = {
  type: "object",
  properties: { content: { type: "string" } },
  required: ["content"],
  additionalProperties: false,
} as const;

const parseResponse = (text: string | undefined): string | null => {
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed) ||
      Object.keys(parsed).length !== 1 ||
      !("content" in parsed) ||
      typeof parsed.content !== "string"
    ) {
      return null;
    }
    return parsed.content;
  } catch {
    return null;
  }
};

const errorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) return undefined;
  const status = "status" in error ? error.status : undefined;
  const code = "code" in error ? error.code : undefined;
  return typeof status === "number"
    ? status
    : typeof code === "number"
      ? code
      : undefined;
};

const isTimeout = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    /timeout|timed out/i.test(error.message));

const classifyError = (error: unknown): InsightGenerationError => {
  if (isTimeout(error)) return "AI_TIMEOUT";
  const status = errorStatus(error);
  if (status === 429) return "AI_RATE_LIMIT";
  if (status !== undefined && status >= 500) return "AI_SERVER_ERROR";
  return "AI_REQUEST_ERROR";
};

const shouldRetry = (error: unknown): boolean => {
  if (isTimeout(error)) return true;
  const status = errorStatus(error);
  return status !== undefined && status >= 500;
};

export const generateAiInsight = async (
  candidate: InsightCandidate,
  periodType: ReportPeriodType,
  templateContent: string,
  config: GeminiInsightConfig,
): Promise<AiGenerationResult> => {
  if (!config.enabled) return { content: null, error: "AI_DISABLED" };
  if (!config.apiKey) return { content: null, error: "AI_API_KEY_MISSING" };

  const client = getGeminiClient(config.apiKey);
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await client.models.generateContent({
        model: config.model,
        contents: createInsightPrompt({ periodType, candidate, templateContent }),
        config: {
          systemInstruction: INSIGHT_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema,
          temperature: 0.4,
          maxOutputTokens: 180,
          abortSignal: AbortSignal.timeout(config.timeoutMs),
          httpOptions: { timeout: Math.max(10_000, config.timeoutMs) },
        },
      });
      if (!response.text) {
        return { content: null, error: "MODEL_RESPONSE_BLOCKED" };
      }
      const content = parseResponse(response.text);
      if (!content) return { content: null, error: "INVALID_JSON" };
      if (!validateAiInsightContent(content, candidate, templateContent)) {
        return { content: null, error: "INVALID_CONTENT" };
      }
      console.info("[insight-ai] generation succeeded", {
        insightType: candidate.type,
        model: config.model,
        promptVersion: config.promptVersion,
        durationMs: Date.now() - startedAt,
        attempt: attempt + 1,
        inputTokens: response.usageMetadata?.promptTokenCount ?? null,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? null,
      });
      return { content: content.trim(), error: null };
    } catch (error) {
      if (attempt < config.maxRetries && shouldRetry(error)) continue;
      const classified = classifyError(error);
      console.warn("[insight-ai] generation failed", {
        insightType: candidate.type,
        model: config.model,
        promptVersion: config.promptVersion,
        durationMs: Date.now() - startedAt,
        attempt: attempt + 1,
        error: classified,
        status: errorStatus(error) ?? null,
      });
      return { content: null, error: classified };
    }
  }
  return { content: null, error: "AI_REQUEST_ERROR" };
};
