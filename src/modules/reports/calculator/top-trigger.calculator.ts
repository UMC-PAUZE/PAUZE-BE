import type {
  InsightCalculationContext,
  InsightCandidate,
  TriggerRankMetric,
} from "./insight.types.js";
import { getInsightPriority } from "./insight.types.js";
import {
  average,
  getTriggerScore,
  roundOne,
  TRIGGER_CODES,
  TRIGGER_NAMES,
} from "./score.util.js";

export interface TopTriggerCalculation {
  candidate: InsightCandidate | null;
  ranks: TriggerRankMetric[];
}

export const calculateTopTrigger = ({
  periodType,
  conditions,
}: InsightCalculationContext): TopTriggerCalculation => {
  if (conditions.length === 0) return { candidate: null, ranks: [] };

  const ranked = TRIGGER_CODES.map((code) => {
    const scores = conditions.map((condition) => getTriggerScore(condition, code));
    return {
      code,
      triggerName: TRIGGER_NAMES[code],
      averageScore: roundOne(average(scores)),
      triggerCount: scores.filter((score) => score >= 13).length,
      highestScoreCount: scores.filter((score) => score === 20).length,
    };
  }).sort(
    (a, b) =>
      b.triggerCount - a.triggerCount ||
      b.averageScore - a.averageScore ||
      b.highestScoreCount - a.highestScoreCount ||
      TRIGGER_CODES.indexOf(a.code) - TRIGGER_CODES.indexOf(b.code),
  );

  const ranks = ranked.slice(0, 5).map((metric, index) => ({
    ...metric,
    rankOrder: index + 1,
  }));
  const first = ranks[0];
  const second = ranks[1];
  const completelyTied =
    first &&
    second &&
    first.triggerCount === second.triggerCount &&
    first.averageScore === second.averageScore &&
    first.highestScoreCount === second.highestScoreCount;

  if (!first || first.triggerCount === 0 || completelyTied) {
    return { candidate: null, ranks };
  }

  return {
    ranks,
    candidate: {
      type: "TOP_TRIGGER",
      priority: getInsightPriority(periodType, "TOP_TRIGGER"),
      metrics: {
        triggerCode: first.code,
        triggerName: first.triggerName,
        triggerCount: first.triggerCount,
        averageScore: first.averageScore,
        highestScoreCount: first.highestScoreCount,
      },
    },
  };
};
