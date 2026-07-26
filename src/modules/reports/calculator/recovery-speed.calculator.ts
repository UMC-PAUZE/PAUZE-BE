import type { InsightCalculationContext, InsightCandidate } from "./insight.types.js";
import { getInsightPriority } from "./insight.types.js";
import { average, daysBetween, roundOne } from "./score.util.js";

export const calculateRecoverySpeed = ({
  periodType,
  conditions,
}: InsightCalculationContext): InsightCandidate | null => {
  const sorted = [...conditions].sort(
    (a, b) => a.conditionDate.getTime() - b.conditionDate.getTime(),
  );
  const recoveryDays: number[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    if (current.sensitivityScore < 66) continue;

    let highEnd = index;
    while (
      highEnd + 1 < sorted.length &&
      sorted[highEnd + 1]!.sensitivityScore >= 66 &&
      daysBetween(
        sorted[highEnd]!.conditionDate,
        sorted[highEnd + 1]!.conditionDate,
      ) === 1
    ) {
      highEnd += 1;
    }

    const highEndDate = sorted[highEnd]!.conditionDate;
    let recoveryIndex = highEnd + 1;
    while (
      recoveryIndex < sorted.length &&
      sorted[recoveryIndex]!.sensitivityScore > 50
    ) {
      recoveryIndex += 1;
    }
    if (recoveryIndex < sorted.length) {
      recoveryDays.push(
        daysBetween(highEndDate, sorted[recoveryIndex]!.conditionDate),
      );
      index = recoveryIndex;
    } else {
      index = highEnd;
    }
  }

  if (recoveryDays.length === 0) return null;
  return {
    type: "RECOVERY_SPEED",
    priority: getInsightPriority(periodType, "RECOVERY_SPEED"),
    metrics: {
      averageRecoveryDays: roundOne(average(recoveryDays)),
      caseCount: recoveryDays.length,
    },
  };
};
