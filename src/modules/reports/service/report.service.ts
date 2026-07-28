import { AppError } from "../../../common/errors/app.error.js";
import { calculateAccumulatedFatigue } from "../calculator/accumulated-fatigue.calculator.js";
import { calculateHardestDay } from "../calculator/hardest-day.calculator.js";
import type {
  InsightCalculationContext,
  ReportPeriodType,
  TriggerRankMetric,
} from "../calculator/insight.types.js";
import { calculatePauzeEffect } from "../calculator/pauze-effect.calculator.js";
import { calculateRecoverySpeed } from "../calculator/recovery-speed.calculator.js";
import {
  average,
  roundOne,
  toKstDateKey,
} from "../calculator/score.util.js";
import { calculateSleepCorrelation } from "../calculator/sleep-correlation.calculator.js";
import { calculateTopTrigger } from "../calculator/top-trigger.calculator.js";
import { calculateTriggerCombination } from "../calculator/trigger-combination.calculator.js";
import type {
  MonthlyReportDto,
  ReportConditionRecord,
  ReportTriggerCode,
  TopTriggerDto,
  WeeklyReportDto,
  WeeklyScoreDto,
} from "../dto/report.dto.js";
import {
  MonthlyReportFetchFailedError,
  WeeklyReportFetchFailedError,
} from "../errors/report.errors.js";
import {
  findConditionsByUserAndDateRange,
  findPauzeUsagesByUserAndDateRange,
  findStoredReport,
  replaceStoredReport,
} from "../repository/report.repository.js";
import { selectInsights } from "../selector/insight.selector.js";
import { createInsightContent } from "../template/insight-template.service.js";
import { validateInsightContent } from "../validator/insight.validator.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_SHORT_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;
const DAY_LONG_NAMES = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

export interface DateRange {
  start: Date;
  periodEnd: Date;
  endExclusive: Date;
  calculationEndExclusive: Date;
}

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_MS);

const toUtcInstantFromKstDate = (date: Date): Date =>
  new Date(date.getTime() - KST_OFFSET_MS);

const toKstCalendarDate = (now: Date): Date => {
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
};

export const getWeeklyRange = (now = new Date()): DateRange => {
  const today = toKstCalendarDate(now);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = addDays(today, -mondayOffset);
  const endExclusive = addDays(start, 7);
  return {
    start,
    periodEnd: addDays(endExclusive, -1),
    endExclusive,
    calculationEndExclusive: addDays(today, 1),
  };
};

export const getMonthlyRange = (now = new Date()): DateRange => {
  const today = toKstCalendarDate(now);
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const endExclusive = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1),
  );
  return {
    start,
    periodEnd: addDays(endExclusive, -1),
    endExclusive,
    calculationEndExclusive: addDays(today, 1),
  };
};

const reportAverage = (records: ReportConditionRecord[]): number =>
  records.length === 0
    ? 0
    : roundOne(average(records.map(({ sensitivityScore }) => sensitivityScore)));

export const getTriggeredCodes = (
  record: ReportConditionRecord,
): ReportTriggerCode[] => record.triggerCodes;

export const aggregateTopTriggers = (
  records: ReportConditionRecord[],
): TopTriggerDto[] => {
  const { ranks } = calculateTopTrigger({
    periodType: "WEEKLY",
    conditions: records,
    pauzeDates: new Set(),
  });
  return ranks
    .filter(({ triggerCount }) => triggerCount > 0)
    .map(({ rankOrder, triggerName, triggerCount }) => ({
      rank: rankOrder,
      trigger: triggerName,
      count: triggerCount,
    }));
};

const getMonthWeekIndex = (date: Date, monthStart: Date): number => {
  const firstDayOffset = (monthStart.getUTCDay() + 6) % 7;
  return Math.floor((firstDayOffset + date.getUTCDate() - 1) / 7);
};

export const aggregateMonthlyWeeks = (
  records: ReportConditionRecord[],
  monthStart: Date,
): WeeklyScoreDto[] => {
  const groups = new Map<number, ReportConditionRecord[]>();
  for (const record of records) {
    const index = getMonthWeekIndex(record.conditionDate, monthStart);
    groups.set(index, [...(groups.get(index) ?? []), record]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, group]) => ({
      week: `${index + 1}주차`,
      averageScore: reportAverage(group),
    }));
};

export const buildWeeklyReport = (
  current: ReportConditionRecord[],
  previous: ReportConditionRecord[],
  pauzeCount = 0,
  topTriggers = aggregateTopTriggers(current),
  insights: string[] = [],
): WeeklyReportDto => {
  const hardest = current.reduce<ReportConditionRecord | null>(
    (max, record) =>
      !max || record.sensitivityScore > max.sensitivityScore ? record : max,
    null,
  );
  const currentAverage = reportAverage(current);
  return {
    averageScore: currentAverage,
    hardestDay: hardest
      ? DAY_LONG_NAMES[hardest.conditionDate.getUTCDay()]!
      : "",
    hardestScore: hardest?.sensitivityScore ?? 0,
    pauzeCount,
    scoreChange:
      previous.length > 0
        ? roundOne(currentAverage - reportAverage(previous))
        : null,
    dailyScores: current.map((record) => ({
      day: DAY_SHORT_NAMES[record.conditionDate.getUTCDay()]!,
      score: record.sensitivityScore,
    })),
    topTriggers,
    insights,
  };
};

export const buildMonthlyReport = (
  current: ReportConditionRecord[],
  previous: ReportConditionRecord[],
  monthStart: Date,
  pauzeCount = 0,
  topTriggers = aggregateTopTriggers(current),
  insights: string[] = [],
): MonthlyReportDto => {
  const weeklyScores = aggregateMonthlyWeeks(current, monthStart);
  const hardest = weeklyScores.reduce<WeeklyScoreDto | null>(
    (max, week) =>
      !max || week.averageScore > max.averageScore ? week : max,
    null,
  );
  const currentAverage = reportAverage(current);
  return {
    averageScore: currentAverage,
    hardestWeek: hardest?.week ?? "",
    hardestScore: hardest?.averageScore ?? 0,
    pauzeCount,
    scoreChange:
      previous.length > 0
        ? roundOne(currentAverage - reportAverage(previous))
        : null,
    weeklyScores,
    topTriggers,
    insights,
  };
};

const createCandidates = (
  context: InsightCalculationContext,
): {
  candidates: ReturnType<typeof selectInsights>;
  ranks: TriggerRankMetric[];
} => {
  const topTrigger = calculateTopTrigger(context);
  const possible = [
    calculateAccumulatedFatigue(context),
    topTrigger.candidate,
    calculateSleepCorrelation(context),
    calculatePauzeEffect(context),
    calculateRecoverySpeed(context),
    calculateHardestDay(context),
    calculateTriggerCombination(context),
  ].filter((candidate) => candidate !== null);
  return {
    candidates: selectInsights(possible, context.periodType),
    ranks: topTrigger.ranks,
  };
};

const getPreviousStart = (
  periodType: ReportPeriodType,
  range: DateRange,
): Date =>
  periodType === "WEEKLY"
    ? addDays(range.start, -7)
    : new Date(
        Date.UTC(
          range.start.getUTCFullYear(),
          range.start.getUTCMonth() - 1,
          1,
        ),
      );

const generateCurrentReport = async (
  uid: string,
  periodType: ReportPeriodType,
  range: DateRange,
) => {
  const previousStart = getPreviousStart(periodType, range);
  const [records, usages] = await Promise.all([
    findConditionsByUserAndDateRange(
      uid,
      previousStart,
      range.calculationEndExclusive,
    ),
    findPauzeUsagesByUserAndDateRange(
      uid,
      toUtcInstantFromKstDate(range.start),
      toUtcInstantFromKstDate(range.calculationEndExclusive),
    ),
  ]);
  const current = records.filter(
    ({ conditionDate }) => conditionDate >= range.start,
  );
  const previous = records.filter(
    ({ conditionDate }) => conditionDate < range.start,
  );
  const context: InsightCalculationContext = {
    periodType,
    conditions: current,
    pauzeDates: new Set(usages.map(toKstDateKey)),
  };
  const { candidates, ranks } = createCandidates(context);
  const contents = candidates.map((candidate) => {
    const content = createInsightContent(candidate, periodType);
    return validateInsightContent(content, candidate)
      ? content
      : "현재 데이터에서 확인할 수 있는 패턴을 정리했어요.";
  });
  const currentAverage = reportAverage(current);
  const previousAverage =
    previous.length > 0 ? reportAverage(previous) : null;

  const stored = await replaceStoredReport({
    uid,
    reportType: periodType,
    periodStart: range.start,
    periodEnd: range.periodEnd,
    validConditionDays: current.length,
    averageScore: currentAverage,
    previousAverageScore: previousAverage,
    scoreChange:
      previousAverage === null
        ? null
        : roundOne(currentAverage - previousAverage),
    pauzeCount: usages.length,
    triggerRanks: ranks,
    insights: candidates,
    insightContents: contents,
  });
  return { stored, current, previous };
};

const storedInsights = (
  report: NonNullable<Awaited<ReturnType<typeof findStoredReport>>>,
): string[] => report.insights.map(({ content }) => content);

const storedTopTriggers = (
  report: NonNullable<Awaited<ReturnType<typeof findStoredReport>>>,
): TopTriggerDto[] =>
  report.triggerRanks
    .filter(({ triggerCount }) => triggerCount > 0)
    .map(({ rankOrder, triggerCount, trigger }) => ({
      rank: rankOrder,
      trigger: trigger.name,
      count: triggerCount,
    }));

const getWeeklyReportInternal = async (
  uid: string,
  now: Date,
): Promise<WeeklyReportDto> => {
  const range = getWeeklyRange(now);
  const generated = await generateCurrentReport(uid, "WEEKLY", range);
  if (!generated.stored) throw new WeeklyReportFetchFailedError();
  const response = buildWeeklyReport(
    generated.current,
    generated.previous,
    generated.stored.pauzeCount,
    storedTopTriggers(generated.stored),
    storedInsights(generated.stored),
  );
  return {
    ...response,
    averageScore: Number(generated.stored.averageScore),
    scoreChange:
      generated.stored.scoreChange === null
        ? null
        : Number(generated.stored.scoreChange),
  };
};

const getMonthlyReportInternal = async (
  uid: string,
  now: Date,
): Promise<MonthlyReportDto> => {
  const range = getMonthlyRange(now);
  const generated = await generateCurrentReport(uid, "MONTHLY", range);
  if (!generated.stored) throw new MonthlyReportFetchFailedError();
  const response = buildMonthlyReport(
    generated.current,
    generated.previous,
    range.start,
    generated.stored.pauzeCount,
    storedTopTriggers(generated.stored),
    storedInsights(generated.stored),
  );
  return {
    ...response,
    averageScore: Number(generated.stored.averageScore),
    scoreChange:
      generated.stored.scoreChange === null
        ? null
        : Number(generated.stored.scoreChange),
  };
};

export const getWeeklyReport = async (
  uid: string,
  now = new Date(),
): Promise<WeeklyReportDto> => {
  try {
    return await getWeeklyReportInternal(uid, now);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new WeeklyReportFetchFailedError();
  }
};

export const getMonthlyReport = async (
  uid: string,
  now = new Date(),
): Promise<MonthlyReportDto> => {
  try {
    return await getMonthlyReportInternal(uid, now);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new MonthlyReportFetchFailedError();
  }
};
