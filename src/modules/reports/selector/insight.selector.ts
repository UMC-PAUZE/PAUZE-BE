import type {
  InsightCandidate,
  ReportPeriodType,
} from "../calculator/insight.types.js";
import { getInsightPriority } from "../calculator/insight.types.js";

export const selectInsights = (
  candidates: readonly InsightCandidate[],
  periodType: ReportPeriodType,
): InsightCandidate[] => {
  const maximum = periodType === "WEEKLY" ? 3 : 4;
  const selected = [...candidates]
    .sort((a, b) => a.priority - b.priority || a.type.localeCompare(b.type))
    .slice(0, maximum);

  if (selected.length > 0) return selected;
  return [
    {
      type: "INSUFFICIENT_DATA",
      priority: getInsightPriority(periodType, "INSUFFICIENT_DATA"),
      metrics: {},
    },
  ];
};
