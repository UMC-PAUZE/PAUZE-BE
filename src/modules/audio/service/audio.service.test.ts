import assert from "node:assert/strict";
import test from "node:test";
import { AudioCategoryCode } from "../dto/audio.dto.js";
import type { AudioGuideRepository } from "../repository/audio-guide.repository.js";
import type { AudioLikeRepository } from "../repository/audio-like.repository.js";
import type { AudioSaveRepository } from "../repository/audio-save.repository.js";
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
  let created = false;
  const service = createService(
    {
      async findById() {
        return audioRow;
      },
    },
    {},
    {
      async findByAudioIdAndUid() {
        return null;
      },
      async create(audioId, uid) {
        assert.equal(audioId, 1n);
        assert.equal(uid, "user-uid");
        created = true;
        return {} as never;
      },
    },
  );

  const result = await service.toggleAudioSave(1n, "user-uid");

  assert.equal(created, true);
  assert.deepEqual(result, {
    audioId: 1,
    isSaved: true,
    fileUrl: "https://example.com/rain.mp3",
  });
});

test("저장 기록이 있으면 삭제하고 저장 상태 false를 반환한다", async () => {
  let deletedSaveId: bigint | undefined;
  const service = createService(
    {
      async findById() {
        return audioRow;
      },
    },
    {},
    {
      async findByAudioIdAndUid() {
        return { saveId: 5n } as never;
      },
      async delete(saveId) {
        deletedSaveId = saveId;
        return {} as never;
      },
    },
  );

  const result = await service.toggleAudioSave(1n, "user-uid");

  assert.equal(deletedSaveId, 5n);
  assert.equal(result.isSaved, false);
});

test("좋아요 기록 유무에 따라 좋아요 상태를 토글한다", async () => {
  let created = false;
  const service = createService(
    {
      async findById() {
        return audioRow;
      },
    },
    {
      async findByAudioIdAndUid() {
        return null;
      },
      async create() {
        created = true;
        return {} as never;
      },
    },
  );

  const result = await service.toggleAudioLike(1n, "user-uid");

  assert.equal(created, true);
  assert.deepEqual(result, { audioId: 1, isLiked: true });
});
