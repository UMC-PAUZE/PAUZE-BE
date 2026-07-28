import type { InsightCalculationContext, InsightCandidate } from "./insight.types.js";
import { getInsightPriority } from "./insight.types.js";
import { average, roundOne, toDateKey } from "./score.util.js";

export const calculatePauzeEffect = ({
  periodType,
  conditions,
  pauzeDates,
}: InsightCalculationContext): InsightCandidate | null => {
  const used = conditions.filter(({ conditionDate }) =>
    pauzeDates.has(toDateKey(conditionDate)),
  );
  const unused = conditions.filter(
    ({ conditionDate }) => !pauzeDates.has(toDateKey(conditionDate)),
  );
  if (used.length === 0 || unused.length === 0) return null;

  const usedAverage = average(used.map(({ sensitivityScore }) => sensitivityScore));
  const unusedAverage = average(
    unused.map(({ sensitivityScore }) => sensitivityScore),
  );
  const difference = unusedAverage - usedAverage;
  if (difference < 10) return null;

  return {
    type: "PAUZE_EFFECT",
    priority: getInsightPriority(periodType, "PAUZE_EFFECT"),
    metrics: {
      usedAverage: roundOne(usedAverage),
      unusedAverage: roundOne(unusedAverage),
      difference: roundOne(difference),
      usedDays: used.length,
      unusedDays: unused.length,
    },
  };
};
