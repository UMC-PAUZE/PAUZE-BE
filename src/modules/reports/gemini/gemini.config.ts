const parseIntegerAtLeast = (
  value: string | undefined,
  fallback: number,
  minimum: number,
): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
};

export interface GeminiInsightConfig {
  apiKey: string | undefined;
  enabled: boolean;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  promptVersion: string;
}

export const getGeminiInsightConfig = (): GeminiInsightConfig => ({
  apiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
  enabled: process.env.GEMINI_INSIGHT_ENABLED?.toLowerCase() === "true",
  model: process.env.GEMINI_INSIGHT_MODEL?.trim() || "gemini-3.5-flash-lite",
  timeoutMs: parseIntegerAtLeast(
    process.env.GEMINI_INSIGHT_TIMEOUT_MS,
    5_000,
    1,
  ),
  maxRetries: parseIntegerAtLeast(
    process.env.GEMINI_INSIGHT_MAX_RETRIES,
    1,
    0,
  ),
  promptVersion: process.env.GEMINI_INSIGHT_PROMPT_VERSION?.trim() || "v1",
});
