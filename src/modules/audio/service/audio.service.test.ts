import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import { AppError } from "../../../common/errors/app.error.js";
import { AudioCategoryCode } from "../dto/audio.dto.js";
import { AUDIO_CODES } from "../errors/audio.errors.js";
import type { AudioGuideRepository } from "../repository/audio-guide.repository.js";
import { AudioLikeRepository } from "../repository/audio-like.repository.js";
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
): AudioService {
  return new AudioService(
    guideRepository as AudioGuideRepository,
    likeRepository as AudioLikeRepository,
  );
}

test("비로그인 목록은 파일 URL과 좋아요 상태를 반환한다", async () => {
  const service = createService({
    async findMany(pagination, userId?: string) {
      assert.deepEqual(pagination, { size: 8 });
      assert.equal(userId, undefined);
      return [audioRow];
    },
  });

  const result = await service.getAudioGuides({ size: 8 });

  assert.deepEqual(result, {
    content: [
      {
        audioId: 1,
        audioTitle: "빗소리",
        categoryId: 10,
        categoryName: "자연의 소리",
        categoryCode: "NATURE_SOUND",
        fileUrl: "https://example.com/rain.mp3",
        isLiked: false,
      },
    ],
    nextCursor: null,
    hasNext: false,
  });
});

test("로그인 목록은 사용자의 좋아요 상태를 반환한다", async () => {
  const service = createService({
    async findMany(_pagination, userId?: string) {
      assert.equal(userId, "user-uid");
      return [
        {
          ...audioRow,
          likedBy: [{ likedId: 1n }],
        },
      ];
    },
  });

  const { content } = await service.getAudioGuides(
    { size: 8 },
    "user-uid",
  );
  const [result] = content;

  assert.equal(result?.isLiked, true);
});

test("카테고리 코드가 있으면 카테고리 조건으로 목록을 조회한다", async () => {
  const service = createService({
    async findManyByCategoryCode(categoryCode, pagination, userId) {
      assert.equal(categoryCode, AudioCategoryCode.ASMR);
      assert.deepEqual(pagination, { cursor: 10n, size: 8 });
      assert.equal(userId, "user-uid");
      return [];
    },
  });

  const result = await service.getAudioGuidesByCategory(
    AudioCategoryCode.ASMR,
    { cursor: 10n, size: 8 },
    "user-uid",
  );

  assert.deepEqual(result, { content: [], nextCursor: null, hasNext: false });
});

test("좋아요 목록은 사용자의 좋아요 상태를 반환한다", async () => {
  const guideRepository = {
    async findManyLikedByUser(uid: string, pagination) {
      assert.equal(uid, "user-uid");
      assert.deepEqual(pagination, { size: 8 });
      return [
        {
          cursorId: 3n,
          audio: {
            ...audioRow,
            likedBy: [{ likedId: 1n }],
          },
        },
      ];
    },
  };
  const service = createService(guideRepository);

  const { content } = await service.getLikedAudioGuides("user-uid", {
    size: 8,
  });
  const [liked] = content;

  assert.equal(liked?.isLiked, true);
});

test("다음 페이지가 있으면 마지막 항목의 커서를 반환한다", async () => {
  const service = createService({
    async findMany() {
      return [
        { ...audioRow, audioId: 3n },
        { ...audioRow, audioId: 2n },
      ];
    },
  });

  const result = await service.getAudioGuides({ size: 1 });

  assert.equal(result.content.length, 1);
  assert.equal(result.nextCursor, "3");
  assert.equal(result.hasNext, true);
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

test("존재하지 않는 오디오 좋아요 요청의 404 오류를 그대로 유지한다", async () => {
  const service = createService({
    async findById() {
      return null;
    },
  });

  await assert.rejects(
    service.toggleAudioLike(1n, "user-uid"),
    (error) =>
      error instanceof AppError &&
      error.code === AUDIO_CODES.AUDIO_GUIDE_NOT_FOUND &&
      error.statusCode === 404,
  );
});

type AudioRelationName = "audioLiked";

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
