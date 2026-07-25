import { CONDITION_SCORE_POLICY } from "../../conditions/policy/condition.policy.js";
import type { ReportConditionRecord, ReportTriggerCode } from "../dto/report.dto.js";

export const TRIGGER_CODES: readonly ReportTriggerCode[] = [
  "SLEEP_DEPRIVATION",
  "NOISE_EXPOSURE",
  "VISUAL_OVERLOAD",
  "SOCIAL_FATIGUE",
  "ENERGY_DEPLETION",
];

export const TRIGGER_NAMES: Record<ReportTriggerCode, string> = {
  SLEEP_DEPRIVATION: "수면 부족",
  NOISE_EXPOSURE: "소음 노출",
  VISUAL_OVERLOAD: "시각 과부하",
  SOCIAL_FATIGUE: "사회 피로",
  ENERGY_DEPLETION: "에너지 소진",
};

export const getTriggerScore = (
  record: ReportConditionRecord,
  code: ReportTriggerCode,
): number => {
  switch (code) {
    case "SLEEP_DEPRIVATION":
      return CONDITION_SCORE_POLICY.sleep[record.sleepLevel];
    case "NOISE_EXPOSURE":
      return CONDITION_SCORE_POLICY.noise[record.noiseLevel];
    case "VISUAL_OVERLOAD":
      return CONDITION_SCORE_POLICY.visual[record.visualLevel];
    case "SOCIAL_FATIGUE":
      return CONDITION_SCORE_POLICY.social[record.socialLevel];
    case "ENERGY_DEPLETION":
      return CONDITION_SCORE_POLICY.energy[record.energyLevel];
  }
};

export const average = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

export const roundOne = (value: number): number => Math.round(value * 10) / 10;

export const toDateKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;

export const toKstDateKey = (date: Date): string =>
  toDateKey(new Date(date.getTime() + 9 * 60 * 60 * 1000));

export const daysBetween = (from: Date, to: Date): number =>
  Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
