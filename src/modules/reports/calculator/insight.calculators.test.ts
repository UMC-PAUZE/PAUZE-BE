import assert from "node:assert/strict";
import test from "node:test";
import type { ReportConditionRecord } from "../dto/report.dto.js";
import { selectInsights } from "../selector/insight.selector.js";
import { calculateAccumulatedFatigue } from "./accumulated-fatigue.calculator.js";
import { calculateHardestDay } from "./hardest-day.calculator.js";
import type { InsightCalculationContext } from "./insight.types.js";
import { calculatePauzeEffect } from "./pauze-effect.calculator.js";
import { calculateRecoverySpeed } from "./recovery-speed.calculator.js";
import { calculateSleepCorrelation } from "./sleep-correlation.calculator.js";
import { calculateTopTrigger } from "./top-trigger.calculator.js";
import { calculateTriggerCombination } from "./trigger-combination.calculator.js";

const record = (
  date: string,
  sensitivityScore: number,
  levels: Partial<ReportConditionRecord> = {},
): ReportConditionRecord => ({
  conditionDate: new Date(`${date}T00:00:00.000Z`),
  sensitivityScore,
  triggerCodes: [],
  sleepLevel: "OVER_8",
  noiseLevel: "QUIET",
  visualLevel: "LOW",
  socialLevel: "ALONE",
  energyLevel: "ENOUGH",
  ...levels,
});

const context = (
  conditions: ReportConditionRecord[],
  periodType: "WEEKLY" | "MONTHLY" = "WEEKLY",
  pauzeDates: ReadonlySet<string> = new Set(),
): InsightCalculationContext => ({ conditions, periodType, pauzeDates });

test("creates HARDEST_DAY only when the top weekday differs by at least 8", () => {
  const candidate = calculateHardestDay(
    context([
      record("2026-07-20", 50),
      record("2026-07-21", 59),
      record("2026-07-27", 50),
      record("2026-07-28", 61),
    ]),
  );
  assert.equal(candidate?.metrics.dayOfWeek, "화요일");
  assert.equal(candidate?.metrics.difference, 10);
});

test("splits sleep groups in half and requires a 15 percent difference", () => {
  const records = [
    record("2026-07-01", 30, { sleepLevel: "OVER_8" }),
    record("2026-07-02", 35, { sleepLevel: "OVER_8" }),
    record("2026-07-03", 40, { sleepLevel: "SIX_TO_EIGHT" }),
    record("2026-07-04", 60, { sleepLevel: "FOUR_TO_SIX" }),
    record("2026-07-05", 65, { sleepLevel: "LESS_4" }),
    record("2026-07-06", 70, { sleepLevel: "LESS_4" }),
  ];
  assert.equal(
    calculateSleepCorrelation(context(records))?.type,
    "SLEEP_CORRELATION",
  );
});

test("stores Top5 metrics and omits TOP_TRIGGER for a complete tie", () => {
  const result = calculateTopTrigger(context([record("2026-07-01", 40)]));
  assert.equal(result.ranks.length, 5);
  assert.equal(result.candidate, null);
});

test("compares PAUZE use days by KST date key", () => {
  const candidate = calculatePauzeEffect(
    context(
      [record("2026-07-01", 30), record("2026-07-02", 60)],
      "WEEKLY",
      new Set(["2026-07-01"]),
    ),
  );
  assert.equal(candidate?.metrics.difference, 30);
});

test("calculates completed recovery cases after a 66 point high", () => {
  const candidate = calculateRecoverySpeed(
    context([
      record("2026-07-01", 70),
      record("2026-07-02", 68),
      record("2026-07-03", 55),
      record("2026-07-04", 49),
    ]),
  );
  assert.equal(candidate?.metrics.averageRecoveryDays, 2);
});

test("bridges one missing day for accumulated fatigue", () => {
  const candidate = calculateAccumulatedFatigue(
    context([
      record("2026-07-01", 45),
      record("2026-07-03", 50),
      record("2026-07-04", 55),
    ]),
  );
  assert.equal(candidate?.metrics.consecutiveDays, 4);
  assert.equal(
    calculateAccumulatedFatigue(
      context([
        record("2026-07-01", 45),
        record("2026-07-02", 20),
        record("2026-07-03", 50),
      ]),
    ),
    null,
  );
});

test("calculates monthly trigger combinations and applies selector limits", () => {
  const records = [
    record("2026-07-01", 80, {
      sleepLevel: "LESS_4",
      noiseLevel: "HARD",
    }),
    record("2026-07-02", 80, {
      sleepLevel: "LESS_4",
      noiseLevel: "HARD",
    }),
    record("2026-07-03", 80, {
      sleepLevel: "LESS_4",
      noiseLevel: "HARD",
    }),
    record("2026-07-04", 20),
    record("2026-07-05", 20),
    record("2026-07-06", 20),
  ];
  assert.equal(
    calculateTriggerCombination(context(records, "MONTHLY"))?.type,
    "TRIGGER_COMBINATION",
  );
  assert.equal(selectInsights([], "WEEKLY")[0]?.type, "INSUFFICIENT_DATA");
});
