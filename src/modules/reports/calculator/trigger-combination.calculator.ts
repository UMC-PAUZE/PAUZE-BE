import type { InsightCalculationContext, InsightCandidate } from "./insight.types.js";
import { getInsightPriority } from "./insight.types.js";
import {
  average,
  getTriggerScore,
  roundOne,
  TRIGGER_CODES,
  TRIGGER_NAMES,
} from "./score.util.js";

export const calculateTriggerCombination = ({
  periodType,
  conditions,
}: InsightCalculationContext): InsightCandidate | null => {
  if (periodType !== "MONTHLY" || conditions.length === 0) return null;
  const periodAverage = average(
    conditions.map(({ sensitivityScore }) => sensitivityScore),
  );
  const matches: Array<{
    first: (typeof TRIGGER_CODES)[number];
    second: (typeof TRIGGER_CODES)[number];
    days: number;
    combinationAverage: number;
    difference: number;
  }> = [];

  for (let firstIndex = 0; firstIndex < TRIGGER_CODES.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < TRIGGER_CODES.length;
      secondIndex += 1
    ) {
      const first = TRIGGER_CODES[firstIndex]!;
      const second = TRIGGER_CODES[secondIndex]!;
      const combinationDays = conditions.filter(
        (condition) =>
          getTriggerScore(condition, first) >= 13 &&
          getTriggerScore(condition, second) >= 13,
      );
      if (combinationDays.length < 3) continue;
      const combinationAverage = average(
        combinationDays.map(({ sensitivityScore }) => sensitivityScore),
      );
      const difference = combinationAverage - periodAverage;
      if (difference >= 15) {
        matches.push({
          first,
          second,
          days: combinationDays.length,
          combinationAverage,
          difference,
        });
      }
    }
  }

  matches.sort(
    (a, b) =>
      b.difference - a.difference ||
      b.days - a.days ||
      TRIGGER_CODES.indexOf(a.first) - TRIGGER_CODES.indexOf(b.first) ||
      TRIGGER_CODES.indexOf(a.second) - TRIGGER_CODES.indexOf(b.second),
  );
  const first = matches[0];
  const second = matches[1];
  if (!first || (second && first.difference === second.difference)) return null;

  return {
    type: "TRIGGER_COMBINATION",
    priority: getInsightPriority(periodType, "TRIGGER_COMBINATION"),
    metrics: {
      firstTrigger: first.first,
      firstTriggerName: TRIGGER_NAMES[first.first],
      secondTrigger: first.second,
      secondTriggerName: TRIGGER_NAMES[first.second],
      combinationDays: first.days,
      combinationAverage: roundOne(first.combinationAverage),
      periodAverage: roundOne(periodAverage),
      difference: roundOne(first.difference),
    },
  };
};
