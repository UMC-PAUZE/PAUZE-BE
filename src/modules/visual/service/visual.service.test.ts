import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import type { VisualGuideRepository } from "../repository/visual.repository.js";
import { VISUAL_CODES } from "../errors/visual.errors.js";
import { VisualGuideService } from "./visual.service.js";

const visualRow = {
  visualId: 1n,
  visualKey: "visual-guides/test.mp3",
  visualUrl: "https://cdn.example.com/visual-guides/test.mp3",
};

test("DB에 저장된 단일 visual_url을 visualUrl로 반환", async () => {
  const repository = {
    async findCurrent() {
      return visualRow;
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository);

  assert.deepEqual(await service.getVisualGuide(), {
    visualUrl: visualRow.visualUrl,
  });
});

test("DB에 시각 가이드가 없으면 404", async () => {
  const repository = {
    async findCurrent() {
      return null;
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository);

  await assert.rejects(service.getVisualGuide(), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 404);
    return true;
  });
});

test("Visual DB 행을 먼저 삭제하고 visualKey로 S3 객체를 정리한다", async () => {
  const calls: string[] = [];
  const repository = {
    async findCurrent() {
      return visualRow;
    },
    async deleteById(visualId: bigint) {
      calls.push(`db:${visualId}`);
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository, async (key) => {
    calls.push(`s3:${key}`);
  });

  assert.deepEqual(await service.deleteVisualGuide(), { visualId: 1 });
  assert.deepEqual(calls, ["db:1", "s3:visual-guides/test.mp3"]);
});

test("Visual 삭제 후 S3 정리 실패는 성공 응답에 영향을 주지 않는다", async () => {
  const repository = {
    async findCurrent() {
      return visualRow;
    },
    async deleteById() {},
  } as unknown as VisualGuideRepository;
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const service = new VisualGuideService(repository, async () => {
      throw new Error("s3 error");
    });
    assert.deepEqual(await service.deleteVisualGuide(), { visualId: 1 });
  } finally {
    console.error = originalConsoleError;
  }
});

test("Visual DB 삭제 실패는 모듈 500 오류로 변환한다", async () => {
  const repository = {
    async findCurrent() {
      return visualRow;
    },
    async deleteById() {
      throw new Error("database error");
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository, async () => {});

  await assert.rejects(
    service.deleteVisualGuide(),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === VISUAL_CODES.DELETE_FAILED &&
      error.statusCode === 500,
  );
});
