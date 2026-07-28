import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import type { PauzeUsageRepository } from "../repository/pauze-usage.repository.js";
import { PauzeUsageService } from "./pauze-usage.service.js";

test("사용 완료 이력 저장하고 API 응답 형식으로 변환", async () => {
  const completedAt = new Date("2026-07-24T03:30:00.000Z");
  const repository = {
    async create(uid: string, completionId: string) {
      assert.equal(uid, "user-uid");
      assert.match(
        completionId,
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      return {
        usageId: 15n,
        completionId,
        completedAt,
      };
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(repository);

  const result = await service.recordUsage("user-uid");

  assert.equal(result.usageId, "15");
  assert.equal(result.completedAt, "2026-07-24T03:30:00.000Z");
  assert.match(
    result.completionId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
});

test("저장 실패를 AGGREGATION_SAVE_FAILED_500 오류로 변환", async () => {
  const repository = {
    async create() {
      throw new Error("database error");
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(repository);

  await assert.rejects(service.recordUsage("user-uid"), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 500);
    assert.equal(error.code, "AGGREGATION_SAVE_FAILED_500");
    assert.equal(error.message, "누적 집계를 실패하였습니다.");
    return true;
  });
});

test("저장 이후 응답 변환 오류를 저장 실패 오류로 가리지 않음", async () => {
  const repository = {
    async create() {
      return {
        usageId: 15n,
        completionId: "completion-id",
        completedAt: null,
      };
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(repository);

  await assert.rejects(service.recordUsage("user-uid"), (error: unknown) => {
    assert.ok(error instanceof TypeError);
    assert.ok(!(error instanceof AppError));
    return true;
  });
});

test("누적 횟수와 현재 연속 사용 일수 계산", async () => {
  const repository = {
    async countByUser(uid: string) {
      assert.equal(uid, "user-uid");
      return 6;
    },
    async findCompletedDates(uid: string) {
      assert.equal(uid, "user-uid");
      return [
        { completedAt: new Date("2026-07-19T15:30:00.000Z") },
        { completedAt: new Date("2026-07-20T03:00:00.000Z") },
        { completedAt: new Date("2026-07-20T15:00:00.000Z") },
        { completedAt: new Date("2026-07-21T15:00:00.000Z") },
        { completedAt: new Date("2026-07-23T15:00:00.000Z") },
        { completedAt: new Date("2026-07-24T15:00:00.000Z") },
      ];
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(
    repository,
    () => new Date("2026-07-25T03:00:00.000Z"),
  );

  const result = await service.getStatistics("user-uid");

  assert.deepEqual(result, {
    totalUsageCount: 6,
    currentStreakDays: 2,
  });
});

test("같은 한국 날짜의 여러 사용 기록을 연속 일수 1일로 계산한다", async () => {
  const repository = {
    async countByUser() {
      return 2;
    },
    async findCompletedDates() {
      return [
        { completedAt: new Date("2026-07-24T15:10:00.000Z") },
        { completedAt: new Date("2026-07-25T14:50:00.000Z") },
      ];
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(
    repository,
    () => new Date("2026-07-25T03:00:00.000Z"),
  );

  const result = await service.getStatistics("user-uid");

  assert.deepEqual(result, {
    totalUsageCount: 2,
    currentStreakDays: 1,
  });
});

test("마지막 사용일이 어제보다 이전이면 현재 연속 일수를 0으로 반환", async () => {
  const repository = {
    async countByUser() {
      return 3;
    },
    async findCompletedDates() {
      return [
        { completedAt: new Date("2026-07-20T15:00:00.000Z") },
        { completedAt: new Date("2026-07-21T15:00:00.000Z") },
        { completedAt: new Date("2026-07-22T15:00:00.000Z") },
      ];
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(
    repository,
    () => new Date("2026-07-25T03:00:00.000Z"),
  );

  const result = await service.getStatistics("user-uid");

  assert.deepEqual(result, {
    totalUsageCount: 3,
    currentStreakDays: 0,
  });
});

test("사용 기록이 없으면 모든 통계를 0으로 반환", async () => {
  const repository = {
    async countByUser() {
      return 0;
    },
    async findCompletedDates() {
      return [];
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(repository);

  const result = await service.getStatistics("user-uid");

  assert.deepEqual(result, {
    totalUsageCount: 0,
    currentStreakDays: 0,
  });
});

test("통계 조회 실패를 AGGREGATION_GET_FAILED_500 오류로 변환", async () => {
  const repository = {
    async countByUser() {
      throw new Error("database error");
    },
    async findCompletedDates() {
      return [];
    },
  } as unknown as PauzeUsageRepository;
  const service = new PauzeUsageService(repository);

  await assert.rejects(service.getStatistics("user-uid"), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 500);
    assert.equal(error.code, "AGGREGATION_GET_FAILED_500");
    assert.equal(error.message, "사용 통계 조회를 실패하였습니다.");
    return true;
  });
});
