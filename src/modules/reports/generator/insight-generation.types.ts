import type { InsightCandidate } from "../calculator/insight.types.js";

export type InsightGenerationSource = "AI" | "TEMPLATE";

export type InsightGenerationError =
  | "AI_DISABLED"
  | "AI_API_KEY_MISSING"
  | "AI_TIMEOUT"
  | "AI_RATE_LIMIT"
  | "AI_SERVER_ERROR"
  | "AI_REQUEST_ERROR"
  | "INVALID_JSON"
  | "INVALID_CONTENT"
  | "MODEL_RESPONSE_BLOCKED";

export interface GeneratedInsight {
  candidate: InsightCandidate;
  content: string;
  generationSource: InsightGenerationSource;
  modelName: string | null;
  promptVersion: string;
  metrics: Record<string, string | number>;
  calculationHash: string;
  generatedAt: Date | null;
  generationError: InsightGenerationError | null;
}
