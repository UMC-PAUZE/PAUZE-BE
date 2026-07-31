import { getGeminiInsightConfig } from "../gemini/gemini.config.js";
import type {
  InsightCandidate,
  ReportPeriodType,
} from "../calculator/insight.types.js";
import { createInsightContent } from "../template/insight-template.service.js";
import { validateInsightContent } from "../validator/insight.validator.js";
import { generateAiInsight } from "./insight-ai.generator.js";
import { createInsightCalculationHash } from "./insight-hash.util.js";
import type { GeneratedInsight } from "./insight-generation.types.js";

export interface ReusableInsight {
  content: string;
  calculationHash: string | null;
  generationSource: "AI" | "TEMPLATE";
  modelName: string | null;
  promptVersion: string;
  generatedAt: Date | null;
  generationError: string | null;
}

const SAFE_FALLBACK =
  "아직 확인할 수 있는 패턴이 충분하지 않아요. 컨디션을 꾸준히 기록해보세요.";

export const generateInsightContent = async (
  candidate: InsightCandidate,
  periodType: ReportPeriodType,
  reusable?: ReusableInsight,
): Promise<GeneratedInsight> => {
  const config = getGeminiInsightConfig();
  const calculationHash = createInsightCalculationHash(
    candidate,
    periodType,
    config.promptVersion,
    config.model,
  );

  if (
    reusable?.calculationHash === calculationHash &&
    (config.enabled || reusable.generationSource === "TEMPLATE")
  ) {
    return {
      candidate,
      content: reusable.content,
      generationSource: reusable.generationSource,
      modelName: reusable.modelName,
      promptVersion: reusable.promptVersion,
      metrics: candidate.metrics,
      calculationHash,
      generatedAt: reusable.generatedAt,
      generationError: reusable.generationError as GeneratedInsight["generationError"],
    };
  }

  const rawTemplate = createInsightContent(candidate, periodType);
  const templateContent = validateInsightContent(rawTemplate, candidate)
    ? rawTemplate
    : SAFE_FALLBACK;
  const aiResult = await generateAiInsight(
    candidate,
    periodType,
    templateContent,
    config,
  );

  if (aiResult.content) {
    return {
      candidate,
      content: aiResult.content,
      generationSource: "AI",
      modelName: config.model,
      promptVersion: config.promptVersion,
      metrics: candidate.metrics,
      calculationHash,
      generatedAt: new Date(),
      generationError: null,
    };
  }

  return {
    candidate,
    content: templateContent,
    generationSource: "TEMPLATE",
    modelName: null,
    promptVersion: config.promptVersion,
    metrics: candidate.metrics,
    calculationHash,
    generatedAt: null,
    generationError: aiResult.error,
  };
};
