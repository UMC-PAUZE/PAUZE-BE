import { createHash } from "node:crypto";
import type {
  InsightCandidate,
  ReportPeriodType,
} from "../calculator/insight.types.js";

const stableMetrics = (
  metrics: Record<string, string | number>,
): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(metrics).sort(([left], [right]) => left.localeCompare(right)),
  );

export const createInsightCalculationHash = (
  candidate: InsightCandidate,
  periodType: ReportPeriodType,
  promptVersion: string,
  modelName: string,
): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        periodType,
        type: candidate.type,
        metrics: stableMetrics(candidate.metrics),
        promptVersion,
        modelName,
      }),
    )
    .digest("hex");
