import type { InsightCandidate } from "../calculator/insight.types.js";

const NUMBER_PATTERN = /-?\d+(?:\.\d+)?/g;

const normalizeNumber = (value: string | number): string =>
  String(Number(value));

export const validateInsightContent = (
  content: string,
  candidate: InsightCandidate,
): boolean => {
  if (content.trim().length === 0 || content.length > 200) return false;
  const allowed = new Set(
    Object.values(candidate.metrics)
      .filter((value): value is number => typeof value === "number")
      .map(normalizeNumber),
  );
  const outputNumbers = content.match(NUMBER_PATTERN) ?? [];
  return outputNumbers.every((number) => allowed.has(normalizeNumber(number)));
};
