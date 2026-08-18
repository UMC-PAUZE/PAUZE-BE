import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import { BREATHE_CODES } from "../errors/breathe.errors.js";
import type { BreatheGuideRepository } from "../repository/breathe.repository.js";
import {
  type BreatheObjectStorage,
  BreatheGuideUploadService,
} from "./breathe-upload.service.js";

const breatheFile = {
  fieldname: "breatheFile",
  originalname: "breathing.mp3",
  encoding: "7bit",
  mimetype: "audio/mpeg",
  size: 1024,
  buffer: Buffer.from("fake breathe audio"),
} as Express.Multer.File;

function lockedRepository(
  methods: Record<string, unknown>,
): BreatheGuideRepository {
  const repository = {
    ...methods,
    async withMutationLock<T>(
      operation: (locked: BreatheGuideRepository) => Promise<T>,
    ) {
      return operation(repository as unknown as BreatheGuideRepository);
    },
  };
  return repository as unknown as BreatheGuideRepository;
}

function createStorage() {
  const uploadedKeys: string[] = [];
  const deletedKeys: string[] = [];
  const storage: BreatheObjectStorage = {
    buildKey: () => "breathe-guides/test.mp3",
    async upload(params) {
      uploadedKeys.push(params.key);
      return { key: params.key, url: `https://cdn.test/${params.key}` };
    },
    async delete(key) { deletedKeys.push(key); },
  };
  return { storage, uploadedKeys, deletedKeys };
}

test("생성한 breatheKey로 S3에 올리고 DB에 저장한다", async () => {
  let saved: Record<string, unknown> | undefined;
  const repository = lockedRepository({
    async findCurrent() { return null; },
    async saveCurrent(params: Record<string, unknown>) {
      saved = params;
      return {
        breatheId: 1n,
        breatheKey: params.breatheKey,
        breatheUrl: params.breatheUrl,
        createdAt: new Date("2026-08-18T00:00:00.000Z"),
      };
    },
  });
  const { storage, uploadedKeys } = createStorage();
  const service = new BreatheGuideUploadService(repository, storage);

  const result = await service.upload({ breatheFile });

  assert.deepEqual(uploadedKeys, ["breathe-guides/test.mp3"]);
  assert.equal(saved?.breatheKey, "breathe-guides/test.mp3");
  assert.deepEqual(result, {
    breatheId: 1,
    breatheUrl: "https://cdn.test/breathe-guides/test.mp3",
    createdAt: "2026-08-18T00:00:00.000Z",
  });
});

test("기존 호흡 가이드가 있으면 교체 후 이전 객체 정리를 등록한다", async () => {
  const calls: string[] = [];
  const repository = lockedRepository({
    async findCurrent() {
      return {
        breatheId: 1n,
        breatheKey: "breathe-guides/old.mp3",
        breatheUrl: "https://cdn.test/breathe-guides/old.mp3",
      };
    },
    async saveCurrent(params: Record<string, unknown>) {
      calls.push("db:save");
      return {
        breatheId: 1n,
        breatheKey: params.breatheKey,
        breatheUrl: params.breatheUrl,
        createdAt: new Date("2026-08-18T00:00:00.000Z"),
      };
    },
    async enqueueCleanup(key: string) { calls.push(`db:enqueue:${key}`); },
  });
  const storage: BreatheObjectStorage = {
    buildKey: () => "breathe-guides/new.mp3",
    async upload(params) {
      calls.push(`s3:upload:${params.key}`);
      return { key: params.key, url: `https://cdn.test/${params.key}` };
    },
    async delete(key) { calls.push(`s3:delete:${key}`); },
  };

  await new BreatheGuideUploadService(repository, storage).upload({ breatheFile });

  assert.deepEqual(calls, [
    "s3:upload:breathe-guides/new.mp3",
    "db:save",
    "db:enqueue:breathe-guides/old.mp3",
  ]);
});

test("DB 저장 실패 시 새 S3 객체를 삭제한다", async () => {
  const repository = lockedRepository({
    async findCurrent() { return null; },
    async saveCurrent() { throw new Error("DB failed"); },
  });
  const { storage, deletedKeys } = createStorage();
  const service = new BreatheGuideUploadService(repository, storage);

  await assert.rejects(
    service.upload({ breatheFile }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === BREATHE_CODES.UPLOAD_FAILED &&
      error.statusCode === 500,
  );
  assert.deepEqual(deletedKeys, ["breathe-guides/test.mp3"]);
});

test("DB 저장과 새 S3 객체 삭제가 실패하면 정리 작업을 등록한다", async () => {
  const cleanupKeys: string[] = [];
  const repository = lockedRepository({
    async findCurrent() { return null; },
    async saveCurrent() { throw new Error("DB failed"); },
    async enqueueCleanup(key: string) { cleanupKeys.push(key); },
  });
  const storage: BreatheObjectStorage = {
    buildKey: () => "breathe-guides/orphaned.mp3",
    async upload(params) {
      return { key: params.key, url: `https://cdn.test/${params.key}` };
    },
    async delete() { throw new Error("S3 delete failed"); },
  };
  const service = new BreatheGuideUploadService(repository, storage);

  await assert.rejects(
    service.upload({ breatheFile }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === BREATHE_CODES.UPLOAD_FAILED &&
      error.statusCode === 500,
  );
  assert.deepEqual(cleanupKeys, ["breathe-guides/orphaned.mp3"]);
});
