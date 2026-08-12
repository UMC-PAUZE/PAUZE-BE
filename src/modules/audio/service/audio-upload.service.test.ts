import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import { AudioCategoryCode } from "../../../generated/prisma/client.js";
import { AUDIO_CODES } from "../errors/audio.errors.js";
import type {
  AudioUploadCreateParams,
  AudioUploadRepositoryContract,
} from "../repository/audio-upload.repository.js";
import {
  AudioUploadService,
  type AudioObjectStorage,
} from "./audio-upload.service.js";

const audioFile = {
  fieldname: "audioFile",
  originalname: "rain.mp3",
  encoding: "7bit",
  mimetype: "audio/mpeg",
  size: 1024,
  buffer: Buffer.from("fake audio"),
} as Express.Multer.File;

function createStorage(overrides: Partial<AudioObjectStorage> = {}) {
  const uploadedKeys: string[] = [];
  const deletedKeys: string[] = [];
  const storage: AudioObjectStorage = {
    buildKey: () => "audio-guides/test.mp3",
    async upload(params) {
      uploadedKeys.push(params.key);
      return { key: params.key, url: `https://cdn.test/${params.key}` };
    },
    async delete(key) {
      deletedKeys.push(key);
    },
    ...overrides,
  };
  return { storage, uploadedKeys, deletedKeys };
}

function createRepository(
  overrides: Partial<AudioUploadRepositoryContract> = {},
): AudioUploadRepositoryContract {
  return {
    async findCategoryByCode() {
      return { categoryId: 1n };
    },
    async create(params: AudioUploadCreateParams) {
      return {
        audioId: 1n,
        audioTitle: params.audioTitle,
        categoryCode: AudioCategoryCode.NATURE_SOUND,
        audioUrl: params.audioUrl,
        createdAt: params.createdAt,
      };
    },
    ...overrides,
  };
}

test("Audio Multipart 파일을 S3에 올리고 DB URL을 응답한다", async () => {
  let createdInput: unknown;
  const repository = createRepository({
    async findCategoryByCode(categoryCode) {
      assert.equal(categoryCode, AudioCategoryCode.NATURE_SOUND);
      return { categoryId: 1n };
    },
    async create(params) {
      createdInput = params;
      return {
        audioId: 4n,
        audioTitle: "빗소리",
        categoryCode: AudioCategoryCode.NATURE_SOUND,
        audioUrl: "https://cdn.test/audio-guides/test.mp3",
        createdAt: new Date("2026-08-11T06:30:00.000Z"),
      };
    },
  });
  const { storage, uploadedKeys } = createStorage();
  const service = new AudioUploadService(repository, storage);

  const result = await service.upload({
    audioFile,
    audioTitle: "  빗소리  ",
    categoryCode: "NATURE_SOUND",
  });

  assert.deepEqual(uploadedKeys, ["audio-guides/test.mp3"]);
  const saved = createdInput as {
    audioTitle: string;
    categoryId: bigint;
    audioKey: string;
    audioUrl: string;
    createdAt: Date;
  };
  assert.equal(saved.audioTitle, "빗소리");
  assert.equal(saved.categoryId, 1n);
  assert.equal(saved.audioKey, "audio-guides/test.mp3");
  assert.equal(saved.audioUrl, "https://cdn.test/audio-guides/test.mp3");
  assert.equal(saved.createdAt instanceof Date, true);
  assert.deepEqual(result, {
    audioId: 4,
    audioTitle: "빗소리",
    categoryCode: "NATURE_SOUND",
    audioUrl: "https://cdn.test/audio-guides/test.mp3",
    createdAt: "2026-08-11T06:30:00.000Z",
  });
});

test("잘못된 오디오 파일이면 S3와 DB를 호출하지 않는다", async () => {
  let categoryCalled = false;
  const repository = createRepository({
    async findCategoryByCode() {
      categoryCalled = true;
      return { categoryId: 1n };
    },
  });
  const { storage, uploadedKeys } = createStorage();
  const service = new AudioUploadService(repository, storage);

  await assert.rejects(
    service.upload({
      audioFile: { ...audioFile, originalname: "image.jpg", mimetype: "image/jpeg" },
      audioTitle: "잘못된 파일",
      categoryCode: "NATURE_SOUND",
    }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === AUDIO_CODES.AUDIO_FILE_INVALID &&
      error.statusCode === 400,
  );
  assert.equal(categoryCalled, false);
  assert.equal(uploadedKeys.length, 0);
});

test("카테고리가 없으면 S3를 호출하지 않는다", async () => {
  const repository = createRepository({
    async findCategoryByCode() {
      return null;
    },
  });
  const { storage, uploadedKeys } = createStorage();
  const service = new AudioUploadService(repository, storage);

  await assert.rejects(
    service.upload({ audioFile, audioTitle: "빗소리", categoryCode: "NOISE" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === AUDIO_CODES.AUDIO_CATEGORY_NOT_FOUND &&
      error.statusCode === 404,
  );
  assert.equal(uploadedKeys.length, 0);
});

test("DB 저장이 실패하면 업로드한 S3 객체를 삭제한다", async () => {
  const repository = createRepository({
    async findCategoryByCode() {
      return { categoryId: 1n };
    },
    async create() {
      throw new Error("DB failed");
    },
  });
  const { storage, deletedKeys } = createStorage();
  const service = new AudioUploadService(repository, storage);

  await assert.rejects(
    service.upload({ audioFile, audioTitle: "빗소리", categoryCode: "NATURE_SOUND" }),
    (error: unknown) =>
      error instanceof AppError &&
      error.code === AUDIO_CODES.UPLOAD_FAILED &&
      error.statusCode === 500,
  );
  assert.deepEqual(deletedKeys, ["audio-guides/test.mp3"]);
});
