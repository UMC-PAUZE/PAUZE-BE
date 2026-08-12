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

function lockedRepository(
  methods: Record<string, unknown>,
): VisualGuideRepository {
  const repository = {
    ...methods,
    async withMutationLock<T>(
      operation: (locked: VisualGuideRepository) => Promise<T>,
    ) {
      return operation(repository as unknown as VisualGuideRepository);
    },
  };
  return repository as unknown as VisualGuideRepository;
}

test("DB에 저장된 단일 visual_url을 visualUrl로 반환", async () => {
  const repository = lockedRepository({
    async findCurrent() {
      return visualRow;
    },
  });
  const service = new VisualGuideService(repository);

  assert.deepEqual(await service.getVisualGuide(), {
    visualUrl: visualRow.visualUrl,
  });
});

test("DB에 시각 가이드가 없으면 404", async () => {
  const repository = lockedRepository({
    async findCurrent() {
      return null;
    },
  });
  const service = new VisualGuideService(repository);

  await assert.rejects(service.getVisualGuide(), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND);
    return true;
  });
});
