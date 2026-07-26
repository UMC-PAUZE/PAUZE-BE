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
  let runEnd: Date | null = null;
  let runLength = 0;
  let longest = 0;

  const closeRun = () => {
    longest = Math.max(longest, runLength);
    runEnd = null;
    runLength = 0;
  };

  for (const condition of sorted) {
    if (condition.sensitivityScore < 41) {
      closeRun();
      continue;
    }
    if (!runEnd) {
      runEnd = condition.conditionDate;
      runLength = 1;
      continue;
    }
    const gap = daysBetween(runEnd, condition.conditionDate);
    if (gap <= 2) {
      runEnd = condition.conditionDate;
      runLength += 1;
    } else {
      closeRun();
      runEnd = condition.conditionDate;
      runLength = 1;
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
