import assert from "node:assert/strict";
import test from "node:test";
import type { ReportConditionRecord } from "../dto/report.dto.js";
import {
  aggregateMonthlyWeeks,
  aggregateTopTriggers,
  buildMonthlyReport,
  buildWeeklyReport,
  getTriggeredCodes,
  getMonthlyRange,
  getWeeklyRange,
} from "./report.service.js";

const record = (
  date: string,
  score: number,
  levels: Partial<Omit<ReportConditionRecord, "conditionDate" | "sensitivityScore">> = {},
): ReportConditionRecord => ({
  conditionDate: new Date(`${date}T00:00:00.000Z`),
  sensitivityScore: score,
  triggerCodes: [],
  sleepLevel: "OVER_8",
  noiseLevel: "QUIET",
  visualLevel: "LOW",
  socialLevel: "ALONE",
  energyLevel: "ENOUGH",
  ...levels,
});

test("builds a weekly report and calculates hardest day and score change", () => {
  const report = buildWeeklyReport(
    [record("2026-07-13", 40), record("2026-07-17", 80)],
    [record("2026-07-06", 70), record("2026-07-07", 50)],
    0,
  );

  assert.equal(report.averageScore, 60);
  assert.equal(report.hardestDay, "금요일");
  assert.equal(report.hardestScore, 80);
  assert.equal(report.scoreChange, 0);
  assert.deepEqual(report.dailyScores, [
    { day: "월", score: 40 },
    { day: "금", score: 80 },
  ]);
});

test("returns null score change when the previous week has no data", () => {
  assert.equal(buildWeeklyReport([record("2026-07-13", 40)], [], 0).scoreChange, null);
});

test("uses the actual PAUZE completion count supplied for the report period", () => {
  assert.equal(buildWeeklyReport([record("2026-07-13", 40)], [], 3).pauzeCount, 3);
  assert.equal(
    buildMonthlyReport(
      [record("2026-07-13", 40)],
      [],
      new Date("2026-07-01T00:00:00.000Z"),
      7,
    ).pauzeCount,
    7,
  );
});

test("builds an empty report so the insufficient-data insight can be stored", () => {
  assert.equal(buildWeeklyReport([], [], 0).averageScore, 0);
  assert.equal(
    buildMonthlyReport([], [], new Date("2026-07-01T00:00:00.000Z"), 0)
      .averageScore,
    0,
  );
});

test("aggregates trigger codes by frequency with stable tie ordering", () => {
  const triggers = aggregateTopTriggers([
    record("2026-07-13", 50, {
      sleepLevel: "FOUR_TO_SIX",
      noiseLevel: "UNCOMFORTABLE",
    }),
    record("2026-07-14", 50, {
      noiseLevel: "UNCOMFORTABLE",
      energyLevel: "LOW",
    }),
    record("2026-07-15", 50, {
      sleepLevel: "FOUR_TO_SIX",
      energyLevel: "LOW",
    }),
  ]);

  assert.deepEqual(triggers, [
    { rank: 1, trigger: "수면 부족", count: 2 },
    { rank: 2, trigger: "소음 노출", count: 2 },
    { rank: 3, trigger: "에너지 소진", count: 2 },
  ]);
  assert.ok(triggers.length <= 5);
});

test("uses trigger relations stored for each condition", () => {
  assert.deepEqual(
    getTriggeredCodes(record("2026-07-13", 0)),
    [],
  );
  assert.deepEqual(
    getTriggeredCodes(record("2026-07-14", 7)),
    [],
  );
  assert.deepEqual(
    getTriggeredCodes(record("2026-07-15", 13, { triggerCodes: ["NOISE_EXPOSURE"] })),
    ["NOISE_EXPOSURE"],
  );
  assert.deepEqual(
    getTriggeredCodes(record("2026-07-16", 20, { triggerCodes: ["NOISE_EXPOSURE"] })),
    ["NOISE_EXPOSURE"],
  );
});

test("counts a trigger at most once per condition date", () => {
  const triggers = aggregateTopTriggers([
    record("2026-07-13", 20, { noiseLevel: "UNCOMFORTABLE" }),
  ]);
  assert.deepEqual(triggers, [{ rank: 1, trigger: "소음 노출", count: 1 }]);
});

test("counts noise exposure across 18 distinct dates independently of total averages", () => {
  const records = Array.from({ length: 18 }, (_, index) =>
    record(`2026-07-${String(index + 1).padStart(2, "0")}`, index, {
      noiseLevel: "UNCOMFORTABLE",
    }),
  );
  assert.deepEqual(aggregateTopTriggers(records)[0], {
    rank: 1,
    trigger: "소음 노출",
    count: 18,
  });
  assert.equal(buildMonthlyReport(records, [], new Date("2026-07-01T00:00:00.000Z"), 0).averageScore, 8.5);
});

test("groups a five-week month and finds its hardest week", () => {
  const monthStart = new Date("2026-07-01T00:00:00.000Z");
  const records = [
    record("2026-07-01", 30),
    record("2026-07-06", 40),
    record("2026-07-13", 50),
    record("2026-07-20", 90),
    record("2026-07-27", 60),
  ];
  const weeks = aggregateMonthlyWeeks(records, monthStart);
  const report = buildMonthlyReport(records, [record("2026-06-30", 50)], monthStart, 0);

  assert.equal(weeks.length, 5);
  assert.equal(report.hardestWeek, "4주차");
  assert.equal(report.hardestScore, 90);
  assert.equal(report.scoreChange, 4);
});

test("calculates KST weekly and monthly boundaries", () => {
  const instant = new Date("2026-07-31T16:00:00.000Z"); // 2026-08-01 01:00 KST
  assert.deepEqual(getWeeklyRange(instant), {
    start: new Date("2026-07-27T00:00:00.000Z"),
    periodEnd: new Date("2026-08-02T00:00:00.000Z"),
    endExclusive: new Date("2026-08-03T00:00:00.000Z"),
    calculationEndExclusive: new Date("2026-08-02T00:00:00.000Z"),
  });
  assert.deepEqual(getMonthlyRange(instant), {
    start: new Date("2026-08-01T00:00:00.000Z"),
    periodEnd: new Date("2026-08-31T00:00:00.000Z"),
    endExclusive: new Date("2026-09-01T00:00:00.000Z"),
    calculationEndExclusive: new Date("2026-08-02T00:00:00.000Z"),
  });
});
