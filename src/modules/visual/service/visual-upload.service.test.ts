import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import { VISUAL_CODES } from "../errors/visual.errors.js";
import type { VisualGuideRepository } from "../repository/visual.repository.js";
import {
  type VisualObjectStorage,
  VisualGuideUploadService,
} from "./visual-upload.service.js";

const visualFile = {
  fieldname: "visualFile",
  originalname: "meditation.mp3",
  encoding: "7bit",
  mimetype: "audio/mpeg",
  size: 1024,
  buffer: Buffer.from("fake visual audio"),
} as Express.Multer.File;

function createStorage() {
  const uploadedKeys: string[] = [];
  const deletedKeys: string[] = [];
  const storage: VisualObjectStorage = {
    buildKey: () => "visual-guides/test.mp3",
    async upload(params) {
      uploadedKeys.push(params.key);
      return { key: params.key, url: `https://cdn.test/${params.key}` };
    },
    async delete(key) {
      deletedKeys.push(key);
    },
  };
  return { storage, uploadedKeys, deletedKeys };
}

test("백엔드가 생성한 visualKey로 S3에 올리고 DB에 저장한다", async () => {
  let saved: Record<string, unknown> | undefined;
  const repository = {
    async findCurrent() {
      return null;
    },
    async saveCurrent(params: Record<string, unknown>) {
      saved = params;
      return {
        visualId: 1n,
        visualKey: params.visualKey,
        visualTitle: params.visualTitle,
        visualUrl: params.visualUrl,
        createdAt: new Date("2026-08-11T06:30:00.000Z"),
      };
    },
  } as unknown as VisualGuideRepository;
  const { storage, uploadedKeys } = createStorage();
  const service = new VisualGuideUploadService(repository, storage);

  const result = await service.upload({
    visualFile,
    visualTitle: "명상",
    content: "안정 가이드",
  });

  assert.deepEqual(uploadedKeys, ["visual-guides/test.mp3"]);
  assert.equal(saved?.visualKey, "visual-guides/test.mp3");
  assert.equal(saved?.visualUrl, "https://cdn.test/visual-guides/test.mp3");
  assert.deepEqual(result, {
    visualId: 1,
    visualTitle: "명상",
    visualUrl: "https://cdn.test/visual-guides/test.mp3",
    createdAt: "2026-08-11T06:30:00.000Z",
  });
});

test("기존 Visual이 있으면 DB를 교체한 뒤 이전 S3 객체를 삭제한다", async () => {
  let savedVisualId: unknown;
  const repository = {
    async findCurrent() {
      return {
        visualId: 1n,
        visualKey: "visual-guides/old.mp3",
        visualUrl: "https://cdn.test/visual-guides/old.mp3",
      };
    },
    async saveCurrent(params: Record<string, unknown>) {
      savedVisualId = params.visualId;
      return {
        visualId: 1n,
        visualKey: params.visualKey,
        visualTitle: params.visualTitle,
        visualUrl: params.visualUrl,
        createdAt: new Date("2026-08-11T06:30:00.000Z"),
      };
    },
  } as unknown as VisualGuideRepository;
  const { storage, deletedKeys } = createStorage();
  const service = new VisualGuideUploadService(repository, storage);

  await service.upload({ visualFile, visualTitle: "명상" });

  assert.equal(savedVisualId, 1n);
  assert.deepEqual(deletedKeys, ["visual-guides/old.mp3"]);
});

test("Visual DB 저장 실패 시 새 S3 객체를 삭제한다", async () => {
  const repository = {
    async findCurrent() {
      return null;
    },
    async saveCurrent() {
      throw new Error("DB failed");
    },
  } as unknown as VisualGuideRepository;
  const { storage, deletedKeys } = createStorage();
  const service = new VisualGuideUploadService(repository, storage);

  await assert.rejects(
    service.upload({ visualFile, visualTitle: "명상" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === VISUAL_CODES.UPLOAD_FAILED &&
      error.statusCode === 500,
  );
  assert.deepEqual(deletedKeys, ["visual-guides/test.mp3"]);
});
