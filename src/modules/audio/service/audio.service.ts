import { AppError } from "../../../common/errors/app.error.js";
import { deleteObject } from "../../../common/utils/s3.util.js";
import type {
  AudioDeleteResult,
  AudioCategoryCode,
  AudioCursorPagination,
  AudioGuideCursorPage,
  AudioGuideListItem,
  AudioLikeToggleResult,
} from "../dto/audio.dto.js";
import { AudioCategoryCode as AudioCategoryCodeValue } from "../dto/audio.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";
import {
  type AudioGuideListRow,
  type AudioGuideRepositoryContract,
  audioGuideRepository,
} from "../repository/audio-guide.repository.js";
import {
  type AudioLikeRepository,
  audioLikeRepository,
} from "../repository/audio-like.repository.js";

const AUDIO_CATEGORY_NAMES: Record<AudioCategoryCodeValue, string> = {
  [AudioCategoryCodeValue.NATURE_SOUND]: "자연의 소리", //categoryCode: "NATURE_SOUND"
  [AudioCategoryCodeValue.ASMR]: "ASMR", //categoryCode: "ASMR"
  [AudioCategoryCodeValue.NOISE]: "노이즈", //categoryCode: "NOISE"
};

export class AudioService {
  constructor(
    private readonly audioGuideRepository: AudioGuideRepositoryContract,
    private readonly audioLikeRepository: AudioLikeRepository,
    private readonly deleteAudioObject: (key: string) => Promise<void> =
      deleteObject,
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

  async deleteAudioGuide(audioId: bigint): Promise<AudioDeleteResult> {
    try {
      const cleanup =
        await this.audioGuideRepository.deleteByIdWithCleanup(audioId);
      if (!cleanup) {
        throw new AppError({
          code: AUDIO_CODES.AUDIO_GUIDE_NOT_FOUND,
          message: AUDIO_MESSAGES.AUDIO_GUIDE_NOT_FOUND,
          statusCode: 404,
        });
      }

      try {
        await this.deleteAudioObject(cleanup.audioKey);
        await this.audioGuideRepository.completeCleanup(cleanup.cleanupId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        try {
          await this.audioGuideRepository.recordCleanupFailure(
            cleanup.cleanupId,
            message,
          );
        } catch (recordError) {
          console.error("[AudioService] cleanup failure recording failed", {
            cleanupId: cleanup.cleanupId.toString(),
            recordError,
          });
        }
        console.error("[AudioService] S3 cleanup failed", {
          audioId: audioId.toString(),
          audioKey: cleanup.audioKey,
          error,
        });
      }

      return { audioId: Number(audioId) };
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        code: AUDIO_CODES.DELETE_AUDIO_GUIDE_FAILED,
        message: AUDIO_MESSAGES.DELETE_AUDIO_GUIDE_FAILED,
        statusCode: 500,
      });
    }
  }

  private toListItem(
    audio: AudioGuideListRow,
  ): AudioGuideListItem {
    return {
      audioId: Number(audio.audioId),
      audioTitle: audio.audioTitle,
      categoryId: Number(audio.categoryId),
      categoryName:
        AUDIO_CATEGORY_NAMES[
          audio.category.categoryCode as AudioCategoryCodeValue
        ],
      categoryCode: audio.category.categoryCode as AudioCategoryCodeValue,
      audioUrl: audio.audioUrl,
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
