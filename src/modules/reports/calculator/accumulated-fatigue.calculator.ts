import type { InsightCalculationContext, InsightCandidate } from "./insight.types.js";
import { getInsightPriority } from "./insight.types.js";
import { daysBetween } from "./score.util.js";

export const calculateAccumulatedFatigue = ({
  periodType,
  conditions,
}: InsightCalculationContext): InsightCandidate | null => {
  const sorted = [...conditions].sort(
    (a, b) => a.conditionDate.getTime() - b.conditionDate.getTime(),
  );
  let runStart: Date | null = null;
  let runEnd: Date | null = null;
  let longest = 0;

  const closeRun = () => {
    if (runStart && runEnd) {
      longest = Math.max(longest, daysBetween(runStart, runEnd) + 1);
    }
    runStart = null;
    runEnd = null;
  };

  for (const condition of sorted) {
    if (condition.sensitivityScore < 41) {
      closeRun();
      continue;
    }
    if (!runStart || !runEnd) {
      runStart = condition.conditionDate;
      runEnd = condition.conditionDate;
      continue;
    }
    const gap = daysBetween(runEnd, condition.conditionDate);
    if (gap <= 2) {
      runEnd = condition.conditionDate;
    } else {
      closeRun();
      runStart = condition.conditionDate;
      runEnd = condition.conditionDate;
    }
  }
  closeRun();
  if (longest < 3) return null;

  return {
    type: "ACCUMULATED_FATIGUE",
    priority: getInsightPriority(periodType, "ACCUMULATED_FATIGUE"),
    metrics: {
      consecutiveDays: longest,
      fatigueLevel: "HIGH",
    },
  };
};
