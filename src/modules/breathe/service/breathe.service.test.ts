import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import { BREATHE_CODES } from "../errors/breathe.errors.js";
import type { BreatheGuideRepository } from "../repository/breathe.repository.js";
import { BreatheGuideService } from "./breathe.service.js";

const breatheRow = {
  breatheId: 1n,
  breatheKey: "breathe-guides/test.mp3",
  breatheUrl: "https://cdn.example.com/breathe-guides/test.mp3",
};

function repository(methods: Record<string, unknown>): BreatheGuideRepository {
  return methods as unknown as BreatheGuideRepository;
}

test("DB에 저장된 단일 breathe_url을 breatheUrl로 반환", async () => {
  const service = new BreatheGuideService(
    repository({ async findCurrent() { return breatheRow; } }),
  );

  assert.deepEqual(await service.getBreatheGuide(), {
    breatheUrl: breatheRow.breatheUrl,
  });
});

test("DB에 호흡 가이드가 없으면 404", async () => {
  const service = new BreatheGuideService(
    repository({ async findCurrent() { return null; } }),
  );

  await assert.rejects(service.getBreatheGuide(), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, BREATHE_CODES.BREATHE_GUIDE_NOT_FOUND);
    return true;
  });
});
