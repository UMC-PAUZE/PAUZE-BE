import { AppError } from "../../../common/errors/app.error.js";
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
  MonthlyReportNotFoundError,
  WeeklyReportFetchFailedError,
  WeeklyReportNotFoundError,
} from "../errors/report.errors.js";
import { findConditionsByUserAndDateRange } from "../repository/report.repository.js";

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

const TRIGGER_ORDER: readonly ReportTriggerCode[] = [
  "SLEEP_DEPRIVATION",
  "NOISE_EXPOSURE",
  "VISUAL_STIMULATION",
  "SOCIAL_ISOLATION",
  "LOW_ENERGY",
];

const TRIGGER_LABELS: Record<ReportTriggerCode, string> = {
  SLEEP_DEPRIVATION: "수면시간",
  NOISE_EXPOSURE: "소음 노출",
  VISUAL_STIMULATION: "시각 자극 노출",
  SOCIAL_ISOLATION: "사회적 활동량",
  LOW_ENERGY: "에너지 수준",
};

export interface DateRange {
  start: Date;
  endExclusive: Date;
}

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_MS);

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
  return { start, endExclusive: addDays(start, 7) };
};

export const getMonthlyRange = (now = new Date()): DateRange => {
  const today = toKstCalendarDate(now);
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const endExclusive = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1),
  );
  return { start, endExclusive };
};

const average = (records: ReportConditionRecord[]): number =>
  Math.round(
    records.reduce((sum, record) => sum + record.sensitivityScore, 0) /
      records.length,
  );

export const getTriggeredCodes = (
  record: ReportConditionRecord,
): ReportTriggerCode[] => record.triggerCodes;

export const aggregateTopTriggers = (
  records: ReportConditionRecord[],
): TopTriggerDto[] => {
  const counts = new Map<ReportTriggerCode, number>(
    TRIGGER_ORDER.map((code) => [code, 0]),
  );

  for (const record of records) {
    for (const code of getTriggeredCodes(record)) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return TRIGGER_ORDER.map((code, order) => ({
    code,
    order,
    count: counts.get(code) ?? 0,
  }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, 5)
    .map(({ code, count }, index) => ({
      rank: index + 1,
      trigger: TRIGGER_LABELS[code],
      count,
    }));
};

const buildWeeklyInsights = (
  hardestDay: string,
  topTriggers: TopTriggerDto[],
  records: ReportConditionRecord[],
): string[] => {
  const insights = [`${hardestDay}에 예민함이 가장 높게 나타났어요.`];
  const topTrigger = topTriggers[0];
  if (topTrigger) {
    insights.push(
      `이번 주에는 ${topTrigger.trigger} 트리거가 가장 자주 나타났어요.`,
    );
  }

  const weekdays = records.filter((record) => {
    const day = record.conditionDate.getUTCDay();
    return day >= 1 && day <= 5;
  });
  const weekends = records.filter((record) => {
    const day = record.conditionDate.getUTCDay();
    return day === 0 || day === 6;
  });
  if (weekdays.length > 0 && weekends.length > 0 && average(weekends) < average(weekdays)) {
    insights.push("주말에는 평일보다 예민함 점수가 낮게 나타났어요.");
  }
  return insights;
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
    const group = groups.get(index) ?? [];
    group.push(record);
    groups.set(index, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, group]) => ({
      week: `${index + 1}주차`,
      averageScore: average(group),
    }));
};

const buildMonthlyInsights = (
  hardestWeek: string,
  topTriggers: TopTriggerDto[],
): string[] => {
  const insights = [`${hardestWeek}에 예민함이 가장 높게 나타났어요.`];
  const topTrigger = topTriggers[0];
  if (topTrigger) {
    insights.unshift(
      `이번 달에는 ${topTrigger.trigger} 트리거가 가장 자주 나타났어요.`,
    );
  }
  return insights;
};

export const buildWeeklyReport = (
  current: ReportConditionRecord[],
  previous: ReportConditionRecord[],
): WeeklyReportDto => {
  if (current.length === 0) throw new WeeklyReportNotFoundError();

  const hardest = current.reduce((max, record) =>
    record.sensitivityScore > max.sensitivityScore ? record : max,
  );
  const currentAverage = average(current);
  const topTriggers = aggregateTopTriggers(current);
  const hardestDay = DAY_LONG_NAMES[hardest.conditionDate.getUTCDay()]!;

  return {
    averageScore: currentAverage,
    hardestDay,
    hardestScore: hardest.sensitivityScore,
    pauzeCount: 0,
    scoreChange:
      previous.length > 0 ? currentAverage - average(previous) : null,
    dailyScores: current.map((record) => ({
      day: DAY_SHORT_NAMES[record.conditionDate.getUTCDay()]!,
      score: record.sensitivityScore,
    })),
    topTriggers,
    insights: buildWeeklyInsights(hardestDay, topTriggers, current),
  };
};

export const buildMonthlyReport = (
  current: ReportConditionRecord[],
  previous: ReportConditionRecord[],
  monthStart: Date,
): MonthlyReportDto => {
  if (current.length === 0) throw new MonthlyReportNotFoundError();

  const weeklyScores = aggregateMonthlyWeeks(current, monthStart);
  const hardest = weeklyScores.reduce((max, week) =>
    week.averageScore > max.averageScore ? week : max,
  );
  const currentAverage = average(current);
  const topTriggers = aggregateTopTriggers(current);

  return {
    averageScore: currentAverage,
    hardestWeek: hardest.week,
    hardestScore: hardest.averageScore,
    pauzeCount: 0,
    scoreChange:
      previous.length > 0 ? currentAverage - average(previous) : null,
    weeklyScores,
    topTriggers,
    insights: buildMonthlyInsights(hardest.week, topTriggers),
  };
};

export const getWeeklyReport = async (
  uid: string,
  now = new Date(),
): Promise<WeeklyReportDto> => {
  const currentRange = getWeeklyRange(now);
  const previousStart = addDays(currentRange.start, -7);
  try {
    const records = await findConditionsByUserAndDateRange(
      uid,
      previousStart,
      currentRange.endExclusive,
    );
    return buildWeeklyReport(
      records.filter((record) => record.conditionDate >= currentRange.start),
      records.filter((record) => record.conditionDate < currentRange.start),
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new WeeklyReportFetchFailedError();
  }
};

export const getMonthlyReport = async (
  uid: string,
  now = new Date(),
): Promise<MonthlyReportDto> => {
  const currentRange = getMonthlyRange(now);
  const previousStart = new Date(
    Date.UTC(
      currentRange.start.getUTCFullYear(),
      currentRange.start.getUTCMonth() - 1,
      1,
    ),
  );
  try {
    const records = await findConditionsByUserAndDateRange(
      uid,
      previousStart,
      currentRange.endExclusive,
    );
    return buildMonthlyReport(
      records.filter((record) => record.conditionDate >= currentRange.start),
      records.filter((record) => record.conditionDate < currentRange.start),
      currentRange.start,
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new MonthlyReportFetchFailedError();
  }
};
