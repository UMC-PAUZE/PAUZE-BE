import type { ReportConditionRecord, ReportTriggerCode } from "../dto/report.dto.js";

export type ReportPeriodType = "WEEKLY" | "MONTHLY";

export type ReportInsightType =
  | "HARDEST_DAY"
  | "SLEEP_CORRELATION"
  | "TOP_TRIGGER"
  | "PAUZE_EFFECT"
  | "RECOVERY_SPEED"
  | "ACCUMULATED_FATIGUE"
  | "TRIGGER_COMBINATION"
  | "INSUFFICIENT_DATA";

export interface InsightCandidate {
  type: ReportInsightType;
  priority: number;
  metrics: Record<string, string | number>;
}

export interface TriggerRankMetric {
  code: ReportTriggerCode;
  triggerName: string;
  rankOrder: number;
  averageScore: number;
  triggerCount: number;
  highestScoreCount: number;
}

export interface InsightCalculationContext {
  periodType: ReportPeriodType;
  conditions: ReportConditionRecord[];
  pauzeDates: ReadonlySet<string>;
}

const WEEKLY_PRIORITY: Record<ReportInsightType, number> = {
  ACCUMULATED_FATIGUE: 1,
  TOP_TRIGGER: 2,
  SLEEP_CORRELATION: 3,
  PAUZE_EFFECT: 4,
  RECOVERY_SPEED: 5,
  HARDEST_DAY: 6,
  TRIGGER_COMBINATION: 7,
  INSUFFICIENT_DATA: 99,
};

const MONTHLY_PRIORITY: Record<ReportInsightType, number> = {
  ACCUMULATED_FATIGUE: 1,
  TRIGGER_COMBINATION: 2,
  TOP_TRIGGER: 3,
  SLEEP_CORRELATION: 4,
  PAUZE_EFFECT: 5,
  RECOVERY_SPEED: 6,
  HARDEST_DAY: 7,
  INSUFFICIENT_DATA: 99,
};

export const getInsightPriority = (
  periodType: ReportPeriodType,
  type: ReportInsightType,
): number =>
  (periodType === "WEEKLY" ? WEEKLY_PRIORITY : MONTHLY_PRIORITY)[type];
