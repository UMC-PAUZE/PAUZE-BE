import { AppError } from "../../../common/errors/app.error.js";
import type {
  AudioCategoryCode,
  AudioCursorPagination,
  AudioGuideCursorPage,
  AudioGuideListItem,
  AudioLikeToggleResult,
} from "../dto/audio.dto.js";
import { AudioCategoryCode as AudioCategoryCodeValue } from "../dto/audio.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";
import {
  type AudioGuideRepository,
  audioGuideRepository,
} from "../repository/audio-guide.repository.js";
import {
  type AudioLikeRepository,
  audioLikeRepository,
} from "../repository/audio-like.repository.js";
import { getSignedAudioUrl } from "./audio-s3.stub.js";

export class AudioService {
  constructor(
    private readonly audioGuideRepository: AudioGuideRepository,
    private readonly audioLikeRepository: AudioLikeRepository,
  ) {}

  async getAudioGuides(
    pagination: AudioCursorPagination,
    userId?: string,
  ): Promise<AudioGuideCursorPage> {
    try {
      const audioList = await this.audioGuideRepository.findMany(
        pagination,
        userId,
      );
      return this.buildPage(audioList, pagination, (audio) => audio.audioId);
    } catch {
      throw new AppError({
        code: AUDIO_CODES.AUDIO_LIST_FAILED,
        message: AUDIO_MESSAGES.AUDIO_LIST_FAILED,
        statusCode: 500,
      });
    }
  }

  async getAudioGuidesByCategory(
    categoryCode: AudioCategoryCode,
    pagination: AudioCursorPagination,
    userId?: string,
  ): Promise<AudioGuideCursorPage> {
    try {
      const audioList =
        await this.audioGuideRepository.findManyByCategoryCode(
          categoryCode,
          pagination,
          userId,
        );
      return this.buildPage(audioList, pagination, (audio) => audio.audioId);
    } catch {
      throw new AppError({
        code: AUDIO_CODES.AUDIO_LIST_FAILED,
        message: AUDIO_MESSAGES.AUDIO_LIST_FAILED,
        statusCode: 500,
      });
    }
  }

  async getLikedAudioGuides(
    uid: string,
    pagination: AudioCursorPagination,
  ): Promise<AudioGuideCursorPage> {
    try {
      const audioList =
        await this.audioGuideRepository.findManyLikedByUser(uid, pagination);
      return this.buildPage(
        audioList,
        pagination,
        (row) => row.cursorId,
        (row) => row.audio,
      );
    } catch {
      throw new AppError({
        code: AUDIO_CODES.LIKED_AUDIO_LIST_FAILED,
        message: AUDIO_MESSAGES.LIKED_AUDIO_LIST_FAILED,
        statusCode: 500,
      });
    }
  }

  async toggleAudioLike(
    audioId: bigint,
    uid: string,
  ): Promise<AudioLikeToggleResult> {
    try {
      const audio = await this.audioGuideRepository.findById(audioId);
      if (!audio) {
        throw new AppError({
          code: AUDIO_CODES.AUDIO_GUIDE_NOT_FOUND,
          message: AUDIO_MESSAGES.AUDIO_GUIDE_NOT_FOUND,
          statusCode: 404,
        });
      }

      const isLiked = await this.audioLikeRepository.toggle(audioId, uid);
      return { audioId: Number(audioId), isLiked };
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        code: AUDIO_CODES.AUDIO_LIKE_FAILED,
        message: AUDIO_MESSAGES.AUDIO_LIKE_FAILED,
        statusCode: 500,
      });
    }
  }

  private toListItem(
    audio: {
      audioId: bigint;
      audioTitle: string;
      audioUrl: string;
      audioKey: string;
      categoryId: bigint;
      category: {
        categoryName: string;
        audioCode: { codeName: string };
      };
      likedBy?: { likedId: bigint }[];
    },
  ): AudioGuideListItem {
    return {
      audioId: Number(audio.audioId),
      audioTitle: audio.audioTitle,
      categoryId: Number(audio.categoryId),
      categoryName: audio.category.categoryName,
      categoryCode:
        audio.category.audioCode.codeName as AudioCategoryCodeValue,
      fileUrl: getSignedAudioUrl(audio.audioKey, audio.audioUrl),
      isLiked: (audio.likedBy?.length ?? 0) > 0,
    };
  }

  private buildPage<T>(
    rows: T[],
    pagination: AudioCursorPagination,
    getCursor: (row: T) => bigint,
    getAudio: (row: T) => Parameters<AudioService["toListItem"]>[0] =
      (row) => row as Parameters<AudioService["toListItem"]>[0],
  ): AudioGuideCursorPage {
    const hasNext = rows.length > pagination.size;
    const pageRows = hasNext ? rows.slice(0, pagination.size) : rows;
    const lastRow = pageRows.at(-1);

    return {
      content: pageRows.map((row) => this.toListItem(getAudio(row))),
      nextCursor: hasNext && lastRow ? getCursor(lastRow).toString() : null,
      hasNext,
    };
  }
}

export const audioService = new AudioService(
  audioGuideRepository,
  audioLikeRepository,
);
