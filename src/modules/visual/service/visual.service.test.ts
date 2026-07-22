import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import type { VisualGuideRepository } from "../repository/visual.repository.js";
import { VisualGuideService } from "./visual.service.js";

test("returns the mock URL without querying the database", async () => {
  let findByKeyCalls = 0;
  const repository = {
    async findByKey() {
      findByKeyCalls += 1;
      return null;
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository);

  const result = await service.getVisualGuideByKey("meditation");

  assert.equal(findByKeyCalls, 0);
  assert.deepEqual(result, {
    visualKey: "meditation",
    fileUrl: "https://example.com/mock/meditation.gif",
  });
});

test("returns the database URL when a mock URL does not exist", async () => {
  const repository = {
    async findByKey(visualKey: string) {
      return {
        visualKey,
        visualUrl: "https://cdn.example.com/visuals/breathing.gif",
      };
    },
  } as unknown as VisualGuideRepository;
  const service = new VisualGuideService(repository);

  const result = await service.getVisualGuideByKey("breathing");

  assert.deepEqual(result, {
    visualKey: "breathing",
    fileUrl: "https://cdn.example.com/visuals/breathing.gif",
  });
});

test("throws 404 when neither a mock URL nor a database row exists", async () => {
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
