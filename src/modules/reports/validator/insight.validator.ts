import type { InsightCandidate } from "../calculator/insight.types.js";

const NUMBER_PATTERN = /-?\d+(?:\.\d+)?/g;
const FORBIDDEN_EXPRESSIONS = [
  "장애",
  "질환",
  "치료",
  "진단",
  "비정상",
  "심각",
  "반드시",
  "무조건",
  "확실히",
  "문제가 있습니다",
] as const;
const KOREAN_NUMBER_EXPRESSION =
  /(?:한\s*번|두\s*배|세\s*가지|네\s*가지|일주일|하루|이틀|사흘)/;

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

const extractNumbers = (content: string): string[] =>
  (content.match(NUMBER_PATTERN) ?? []).map(normalizeNumber).sort();

const countSentences = (content: string): number => {
  const endings = content.match(/[.!?]+(?=\s|$)/g)?.length ?? 0;
  return Math.max(1, endings);
};

export const validateAiInsightContent = (
  content: string,
  candidate: InsightCandidate,
  templateContent: string,
): boolean => {
  const trimmed = content.trim();
  if (trimmed.length < 10 || trimmed.length > 100) return false;
  if (countSentences(trimmed) > 2) return false;
  if (FORBIDDEN_EXPRESSIONS.some((word) => trimmed.includes(word))) return false;
  if (KOREAN_NUMBER_EXPRESSION.test(trimmed)) return false;
  if (!validateInsightContent(trimmed, candidate)) return false;

  const expectedNumbers = extractNumbers(templateContent);
  const actualNumbers = extractNumbers(trimmed);
  return JSON.stringify(expectedNumbers) === JSON.stringify(actualNumbers);
};
