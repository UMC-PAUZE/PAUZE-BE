import type { InsightCalculationContext, InsightCandidate } from "./insight.types.js";
import { getInsightPriority } from "./insight.types.js";
import { average, getTriggerScore, roundOne } from "./score.util.js";

export const calculateSleepCorrelation = ({
  periodType,
  conditions,
}: InsightCalculationContext): InsightCandidate | null => {
  const sorted = [...conditions].sort(
    (a, b) =>
      getTriggerScore(a, "SLEEP_DEPRIVATION") -
        getTriggerScore(b, "SLEEP_DEPRIVATION") ||
      a.conditionDate.getTime() - b.conditionDate.getTime(),
  );
  const groupSize = Math.floor(sorted.length / 2);
  if (groupSize < 3) return null;

  const rested = sorted.slice(0, groupSize);
  const deprived = sorted.slice(sorted.length - groupSize);
  const restedBoundaryScore = getTriggerScore(
    rested[rested.length - 1]!,
    "SLEEP_DEPRIVATION",
  );
  const deprivedBoundaryScore = getTriggerScore(
    deprived[0]!,
    "SLEEP_DEPRIVATION",
  );
  if (restedBoundaryScore >= deprivedBoundaryScore) return null;

  const restedAverage = average(rested.map(({ sensitivityScore }) => sensitivityScore));
  const deprivedAverage = average(
    deprived.map(({ sensitivityScore }) => sensitivityScore),
  );
  if (deprivedAverage <= 0) return null;

  const differencePercent =
    ((deprivedAverage - restedAverage) / deprivedAverage) * 100;
  if (differencePercent < 15) return null;

  return {
    type: "SLEEP_CORRELATION",
    priority: getInsightPriority(periodType, "SLEEP_CORRELATION"),
    metrics: {
      restedAverage: roundOne(restedAverage),
      deprivedAverage: roundOne(deprivedAverage),
      differencePercent: Math.round(differencePercent),
      restedDays: rested.length,
      deprivedDays: deprived.length,
    },
  };
};
