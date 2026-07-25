import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import type { VisualGuideRepository } from "../repository/visual.repository.js";
import { VisualGuideService } from "./visual.service.js";

test("DB에 데이터가 없으면 mockURL 반환", async () => {
  let findByKeyCalls = 0;
  const repository = {
    async findByKey() {
      findByKeyCalls += 1;
      return null;
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository);

  const result = await service.getVisualGuideByKey("meditation");

  assert.equal(findByKeyCalls, 1);
  assert.deepEqual(result, {
    visualKey: "meditation",
    fileUrl: "https://example.com/mock/meditation.gif",
  });
});

test("DB와 mockURL이 모두 있으면 DB URL을 우선 반환", async () => {
  const repository = {
    async findByKey(visualKey: string) {
      return {
        visualKey,
        visualUrl: "https://cdn.example.com/visuals/meditation.gif",
      };
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository);

  const result = await service.getVisualGuideByKey("meditation");

  assert.deepEqual(result, {
    visualKey: "meditation",
    fileUrl: "https://cdn.example.com/visuals/meditation.gif",
  });
});

test("DB와 mockURL이 모두 없으면 에러(404)", async () => {
  const repository = {
    async findByKey() {
      return null;
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository);

  await assert.rejects(
    service.getVisualGuideByKey("unknown"),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 404);
      return true;
    },
  );
});
