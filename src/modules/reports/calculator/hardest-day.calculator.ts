import type { InsightCalculationContext, InsightCandidate } from "./insight.types.js";
import { getInsightPriority } from "./insight.types.js";
import { average, roundOne } from "./score.util.js";

const DAY_NAMES = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

export const calculateHardestDay = ({
  periodType,
  conditions,
}: InsightCalculationContext): InsightCandidate | null => {
  const groups = new Map<number, number[]>();
  for (const condition of conditions) {
    const day = condition.conditionDate.getUTCDay();
    groups.set(day, [...(groups.get(day) ?? []), condition.sensitivityScore]);
  }

  const ranked = [...groups.entries()]
    .map(([day, scores]) => ({ day, average: average(scores) }))
    .sort((a, b) => b.average - a.average || a.day - b.day);
  const first = ranked[0];
  const second = ranked[1];
  if (!first || !second || first.average - second.average < 8) return null;

  const previousDay = (first.day + 6) % 7;
  return {
    type: "HARDEST_DAY",
    priority: getInsightPriority(periodType, "HARDEST_DAY"),
    metrics: {
      dayOfWeek: DAY_NAMES[first.day]!,
      previousDayOfWeek: DAY_NAMES[previousDay]!,
      highestAverage: roundOne(first.average),
      secondAverage: roundOne(second.average),
      difference: roundOne(first.average - second.average),
    },
  };
};
