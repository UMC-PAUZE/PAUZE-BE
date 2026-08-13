import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import { ConditionAlreadyExistsError } from "../errors/condition.errors.js";
import {
  calculateCondition,
  calculateSensitivityLevel,
  createTodayCondition,
  getKstTodayDate,
  getTodayCondition,
  getUserConditionStats,
  isUniqueConstraintError,
  mapConditionCreateError,
  mapConditionFetchError,
} from "./condition.service.js";

const validCondition = {
  sleepLevel: "OVER_8",
  noiseLevel: "QUIET",
  visualLevel: "LOW",
  socialLevel: "MANY",
  energyLevel: "ENOUGH",
} as const;

test("uses the Asia/Seoul date across the UTC midnight boundary", () => {
  assert.equal(
    getKstTodayDate(new Date("2026-07-20T14:59:59.999Z")).toISOString(),
    "2026-07-20T00:00:00.000Z",
  );
  assert.equal(
    getKstTodayDate(new Date("2026-07-20T15:00:00.000Z")).toISOString(),
    "2026-07-21T00:00:00.000Z",
  );
});

test("calculates the documented example with the social activity policy", () => {
  const result = calculateCondition({
    sleepLevel: "FOUR_TO_SIX",
    noiseLevel: "NORMAL",
    visualLevel: "HIGH",
    socialLevel: "SOME",
    energyLevel: "LOW",
  });

  assert.deepEqual(result, {
    sensitivityScore: 59,
    sensitivityLevel: "NORMAL",
    triggerCodes: [
      "SLEEP_DEPRIVATION",
      "VISUAL_OVERLOAD",
      "SOCIAL_FATIGUE",
      "ENERGY_DEPLETION",
    ],
  });
});

test("calculates minimum and maximum valid scores", () => {
  assert.equal(
    calculateCondition({
      sleepLevel: "OVER_8",
      noiseLevel: "QUIET",
      visualLevel: "LOW",
      socialLevel: "ALONE",
      energyLevel: "ENOUGH",
    }).sensitivityScore,
    0,
  );
  assert.equal(
    calculateCondition({
      sleepLevel: "LESS_4",
      noiseLevel: "HARD",
      visualLevel: "VERY_HIGH",
      socialLevel: "MANY",
      energyLevel: "NONE",
    }).sensitivityScore,
    100,
  );
});

test("uses the specified sensitivity boundaries", () => {
  assert.equal(calculateSensitivityLevel(40), "LOW");
  assert.equal(calculateSensitivityLevel(41), "NORMAL");
  assert.equal(calculateSensitivityLevel(65), "NORMAL");
  assert.equal(calculateSensitivityLevel(66), "HIGH");
});

test("recognizes duplicate-condition database errors", () => {
  assert.equal(isUniqueConstraintError({ code: "P2002" }), true);
  assert.equal(isUniqueConstraintError({ code: "P2025" }), false);
});

test("maps condition persistence errors without losing existing app errors", () => {
  assert.equal(mapConditionCreateError({ code: "P2002" }).statusCode, 409);
  assert.equal(mapConditionCreateError({ code: "P1001" }).statusCode, 503);
  assert.equal(mapConditionCreateError({ code: "ECONNREFUSED" }).statusCode, 503);
  assert.equal(mapConditionCreateError({ code: "P1002" }).statusCode, 504);
  assert.equal(mapConditionCreateError({ code: "P2024" }).statusCode, 504);
  assert.equal(mapConditionCreateError({ code: "ETIMEDOUT" }).statusCode, 504);
  assert.equal(mapConditionCreateError(new Error("unknown")).statusCode, 500);

  const existingError = new AppError({
    code: "EXISTING_ERROR",
    message: "existing",
    statusCode: 422,
  });
  assert.equal(mapConditionCreateError(existingError), existingError);
  assert.ok(mapConditionCreateError({ code: "P2002" }) instanceof ConditionAlreadyExistsError);

  const duplicateError = new ConditionAlreadyExistsError();
  assert.equal(mapConditionCreateError(duplicateError), duplicateError);
});

test("createTodayCondition returns 409 when today's condition exists", async () => {
  await assert.rejects(
    createTodayCondition("user-id", validCondition, {
      findTodayConditionByUserId: async () => ({ conditionId: 1n }),
      insertTodayCondition: async () => {
        throw new Error("must not insert");
      },
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 409 &&
      error.code === "CONDITION_ALREADY_EXISTS_409",
  );
});

test("createTodayCondition returns 500 and logs an unexpected storage error", async (t) => {
  const loggedErrors: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => {
    loggedErrors.push(args);
  });

  const storageError = new Error("unexpected storage failure");
  await assert.rejects(
    createTodayCondition("user-id", validCondition, {
      findTodayConditionByUserId: async () => null,
      insertTodayCondition: async () => {
        throw storageError;
      },
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 500 &&
      error.code === "CONDITION_CREATE_FAILED_500",
  );
  assert.equal(loggedErrors.length, 1);
  assert.equal(loggedErrors[0]?.[1], storageError);
});

test("counts 13 and 20 point answers as triggers but not 0 and 7", () => {
  assert.deepEqual(
    calculateCondition({
      sleepLevel: "OVER_8",
      noiseLevel: "NORMAL",
      visualLevel: "HIGH",
      socialLevel: "MANY",
      energyLevel: "ENOUGH",
    }).triggerCodes,
    ["VISUAL_OVERLOAD", "SOCIAL_FATIGUE"],
  );
});

test("getTodayCondition returns the latest condition", async () => {
  const result = await getTodayCondition("user-id", {
    findLatestConditionByUserId: async () => ({
      conditionId: 12n,
      conditionDate: new Date("2026-08-09T00:00:00.000Z"),
      sleepLevel: "FOUR_TO_SIX",
      noiseLevel: "NORMAL",
      visualLevel: "HIGH",
      socialLevel: "LITTLE",
      energyLevel: "LOW",
      sensitivityScore: 59,
      sensitivityLevel: "NORMAL",
      conditionTriggers: [
        { trigger: { code: "SLEEP_DEPRIVATION" } },
        { trigger: { code: "VISUAL_OVERLOAD" } },
      ],
    }),
  });

  assert.deepEqual(result, {
    conditionId: 12,
    conditionDate: "2026-08-09",
    sleepLevel: "FOUR_TO_SIX",
    noiseLevel: "NORMAL",
    visualLevel: "HIGH",
    socialLevel: "LITTLE",
    energyLevel: "LOW",
    sensitivityScore: 59,
    sensitivityLevel: "NORMAL",
    triggerCodes: ["SLEEP_DEPRIVATION", "VISUAL_OVERLOAD"],
  });
});

test("getTodayCondition returns 404 when no condition exists", async () => {
  await assert.rejects(
    getTodayCondition("user-id", {
      findLatestConditionByUserId: async () => null,
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 404 &&
      error.code === "CONDITION_NOT_FOUND_404",
  );
});

test("mapConditionFetchError maps database and unexpected errors", () => {
  assert.equal(mapConditionFetchError({ code: "P1001" }).statusCode, 503);
  assert.equal(mapConditionFetchError({ code: "ETIMEDOUT" }).statusCode, 504);
  assert.equal(mapConditionFetchError(new Error("unknown")).statusCode, 500);
  assert.equal(
    mapConditionFetchError(new Error("unknown")).code,
    "CONDITION_FETCH_FAILED_500",
  );
});

test("getUserConditionStats returns zeros when there are no measurements", async () => {
  const result = await getUserConditionStats("user-id", {
    aggregateStatsByUser: async () => ({
      _count: { _all: 0 },
      _avg: { sensitivityScore: null },
    }),
    findConditionDatesByUser: async () => [],
  });

  assert.deepEqual(result, {
    totalMeasurements: 0,
    consecutiveDays: 0,
    averageSensitivity: 0,
  });
});

test("getUserConditionStats counts three consecutive days ending today", async () => {
  const result = await getUserConditionStats(
    "user-id",
    {
      aggregateStatsByUser: async () => ({
        _count: { _all: 3 },
        _avg: { sensitivityScore: 40 },
      }),
      findConditionDatesByUser: async () => [
        { conditionDate: new Date("2026-08-11T00:00:00.000Z") },
        { conditionDate: new Date("2026-08-12T00:00:00.000Z") },
        { conditionDate: new Date("2026-08-13T00:00:00.000Z") },
      ],
    },
    () => new Date("2026-08-13T12:00:00.000Z"),
  );

  assert.deepEqual(result, {
    totalMeasurements: 3,
    consecutiveDays: 3,
    averageSensitivity: 40,
  });
});

test("getUserConditionStats returns 0 consecutive days when the last measurement is before yesterday", async () => {
  const result = await getUserConditionStats(
    "user-id",
    {
      aggregateStatsByUser: async () => ({
        _count: { _all: 2 },
        _avg: { sensitivityScore: 50 },
      }),
      findConditionDatesByUser: async () => [
        { conditionDate: new Date("2026-08-10T00:00:00.000Z") },
        { conditionDate: new Date("2026-08-11T00:00:00.000Z") },
      ],
    },
    () => new Date("2026-08-13T12:00:00.000Z"),
  );

  assert.deepEqual(result, {
    totalMeasurements: 2,
    consecutiveDays: 0,
    averageSensitivity: 50,
  });
});

test("getUserConditionStats rounds the average sensitivity to an integer", async () => {
  const result = await getUserConditionStats(
    "user-id",
    {
      aggregateStatsByUser: async () => ({
        _count: { _all: 3 },
        _avg: { sensitivityScore: 23.3 },
      }),
      findConditionDatesByUser: async () => [
        { conditionDate: new Date("2026-08-13T00:00:00.000Z") },
      ],
    },
    () => new Date("2026-08-13T12:00:00.000Z"),
  );

  assert.equal(result.averageSensitivity, 23);
});
