import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import { AppError } from "../../../common/errors/app.error.js";
import { AudioCategoryCode } from "../dto/audio.dto.js";
import { AUDIO_CODES } from "../errors/audio.errors.js";
import type { AudioGuideRepository } from "../repository/audio-guide.repository.js";
import { AudioLikeRepository } from "../repository/audio-like.repository.js";
import { AudioSaveRepository } from "../repository/audio-save.repository.js";
import { AudioService } from "./audio.service.js";

const audioRow = {
  audioId: 1n,
  audioTitle: "빗소리",
  audioUrl: "https://example.com/rain.mp3",
  audioKey: "audio/rain.mp3",
  categoryId: 10n,
  createdAt: new Date("2026-08-09T00:00:00.000Z"),
  updatedAt: null,
  category: {
    categoryName: "자연의 소리",
    audioCode: { codeName: "NATURE_SOUND" },
  },
};

function createService(
  guideRepository: Partial<AudioGuideRepository>,
  likeRepository: Partial<AudioLikeRepository> = {},
  saveRepository: Partial<AudioSaveRepository> = {},
): AudioService {
  return new AudioService(
    guideRepository as AudioGuideRepository,
    likeRepository as AudioLikeRepository,
    saveRepository as AudioSaveRepository,
  );
}

test("비로그인 목록은 좋아요와 저장 상태를 false로 반환한다", async () => {
  const service = createService({
    async findMany(userId?: string) {
      assert.equal(userId, undefined);
      return [audioRow];
    },
  });

  const result = await service.getAudioGuides();

  assert.deepEqual(result, [
    {
      audioId: 1,
      audioTitle: "빗소리",
      categoryId: 10,
      categoryName: "자연의 소리",
      categoryCode: "NATURE_SOUND",
      fileUrl: "https://example.com/rain.mp3",
      isLiked: false,
      isSaved: false,
    },
  ]);
});

test("로그인 목록은 사용자의 좋아요와 저장 상태를 반환한다", async () => {
  const service = createService({
    async findMany(userId?: string) {
      assert.equal(userId, "user-uid");
      return [
        {
          ...audioRow,
          likedBy: [{ likedId: 1n }],
          savedBy: [{ saveId: 2n }],
        },
      ];
    },
  });

  const [result] = await service.getAudioGuides("user-uid");

  assert.equal(result?.isLiked, true);
  assert.equal(result?.isSaved, true);
});

test("카테고리 코드가 있으면 카테고리 조건으로 목록을 조회한다", async () => {
  const service = createService({
    async findManyByCategoryCode(categoryCode, userId) {
      assert.equal(categoryCode, AudioCategoryCode.ASMR);
      assert.equal(userId, "user-uid");
      return [];
    },
  });

  const result = await service.getAudioGuidesByCategory(
    AudioCategoryCode.ASMR,
    "user-uid",
  );

  assert.deepEqual(result, []);
});

test("좋아요와 저장 목록은 다른 사용자 상태도 함께 반환한다", async () => {
  const guideRepository = {
    async findManyLikedByUser(uid: string) {
      assert.equal(uid, "user-uid");
      return [{ ...audioRow, likedBy: [{ likedId: 1n }], savedBy: [] }];
    },
    async findManySavedByUser(uid: string) {
      assert.equal(uid, "user-uid");
      return [{ ...audioRow, likedBy: [], savedBy: [{ saveId: 2n }] }];
    },
  };
  const service = createService(guideRepository);

  const [liked] = await service.getLikedAudioGuides("user-uid");
  const [saved] = await service.getSavedAudioGuides("user-uid");

  assert.equal(liked?.isLiked, true);
  assert.equal(liked?.isSaved, false);
  assert.equal(saved?.isLiked, false);
  assert.equal(saved?.isSaved, true);
});

test("저장 기록이 없으면 생성하고 저장 상태 true를 반환한다", async () => {
  const service = createService(
    {
      async findById() {
        return audioRow;
      },
    },
    {},
    {
      async toggle(audioId, uid) {
        assert.equal(audioId, 1n);
        assert.equal(uid, "user-uid");
        return true;
      },
    },
  );

  const result = await service.toggleAudioSave(1n, "user-uid");

  assert.deepEqual(result, {
    audioId: 1,
    isSaved: true,
    fileUrl: "https://example.com/rain.mp3",
  });
});

test("저장 기록이 있으면 삭제하고 저장 상태 false를 반환한다", async () => {
  const service = createService(
    {
      async findById() {
        return audioRow;
      },
    },
    {},
    {
      async toggle() {
        return false;
      },
    },
  );

  const result = await service.toggleAudioSave(1n, "user-uid");

  assert.equal(result.isSaved, false);
});

test("좋아요 기록 유무에 따라 좋아요 상태를 토글한다", async () => {
  const service = createService(
    {
      async findById() {
        return audioRow;
      },
    },
    {
      async toggle() {
        return true;
      },
    },
  );

  const result = await service.toggleAudioLike(1n, "user-uid");

  assert.deepEqual(result, { audioId: 1, isLiked: true });
});

test("저장 토글의 오디오 조회 실패를 모듈 저장 오류로 변환한다", async () => {
  const service = createService({
    async findById() {
      throw new Error("database error");
    },
  });

  await assert.rejects(
    service.toggleAudioSave(1n, "user-uid"),
    (error) =>
      error instanceof AppError &&
      error.code === AUDIO_CODES.AUDIO_SAVE_FAILED &&
      error.statusCode === 500,
  );
});

test("좋아요 토글의 오디오 조회 실패를 모듈 좋아요 오류로 변환한다", async () => {
  const service = createService({
    async findById() {
      throw new Error("database error");
    },
  });

  await assert.rejects(
    service.toggleAudioLike(1n, "user-uid"),
    (error) =>
      error instanceof AppError &&
      error.code === AUDIO_CODES.AUDIO_LIKE_FAILED &&
      error.statusCode === 500,
  );
});

test("존재하지 않는 오디오의 404 오류를 그대로 유지한다", async () => {
  const service = createService({
    async findById() {
      return null;
    },
  });

  for (const request of [
    service.toggleAudioSave(1n, "user-uid"),
    service.toggleAudioLike(1n, "user-uid"),
  ]) {
    await assert.rejects(
      request,
      (error) =>
        error instanceof AppError &&
        error.code === AUDIO_CODES.AUDIO_GUIDE_NOT_FOUND &&
        error.statusCode === 404,
    );
  }
});

type AudioRelationName = "audioLiked" | "audioSave";

function createSerializedAudioDb(relationName: AudioRelationName) {
  let exists = false;
  let queue = Promise.resolve();
  const isolationLevels: unknown[] = [];
  const relation = {
    async findUnique() {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return exists ? { likedId: 1n, saveId: 1n } : null;
    },
    async create() {
      if (exists) throw { code: "P2002" };
      exists = true;
      return {};
    },
    async delete() {
      if (!exists) throw { code: "P2025" };
      exists = false;
      return {};
    },
  };
  const db = {
    async $transaction<T>(
      operation: (tx: Record<AudioRelationName, typeof relation>) => Promise<T>,
      options: { isolationLevel?: unknown },
    ): Promise<T> {
      isolationLevels.push(options.isolationLevel);
      const result = queue.then(() =>
        operation({ [relationName]: relation } as Record<
          AudioRelationName,
          typeof relation
        >),
      );
      queue = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };

  return {
    db: db as unknown as PrismaClient,
    exists: () => exists,
    isolationLevels,
  };
}

test("동시에 들어온 좋아요 토글을 원자적으로 두 번 반영한다", async () => {
  const fake = createSerializedAudioDb("audioLiked");
  const repository = new AudioLikeRepository(fake.db);

  const results = await Promise.all([
    repository.toggle(1n, "user-uid"),
    repository.toggle(1n, "user-uid"),
  ]);

  assert.deepEqual(results, [true, false]);
  assert.equal(fake.exists(), false);
  assert.deepEqual(fake.isolationLevels, ["Serializable", "Serializable"]);
});

test("동시에 들어온 저장 토글을 원자적으로 두 번 반영한다", async () => {
  const fake = createSerializedAudioDb("audioSave");
  const repository = new AudioSaveRepository(fake.db);

  const results = await Promise.all([
    repository.toggle(1n, "user-uid"),
    repository.toggle(1n, "user-uid"),
  ]);

  assert.deepEqual(results, [true, false]);
  assert.equal(fake.exists(), false);
  assert.deepEqual(fake.isolationLevels, ["Serializable", "Serializable"]);
});
