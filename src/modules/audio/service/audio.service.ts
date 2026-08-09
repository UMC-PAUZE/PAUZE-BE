import { AppError } from "../../../common/errors/app.error.js";
import type {
  AudioCategoryCode,
  AudioGuideListItem,
  AudioLikeToggleResult,
  AudioSaveToggleResult,
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
import {
  type AudioSaveRepository,
  audioSaveRepository,
} from "../repository/audio-save.repository.js";
import { getSignedAudioUrl } from "./audio-s3.stub.js";

export class AudioService {
  constructor(
    private readonly audioGuideRepository: AudioGuideRepository,
    private readonly audioLikeRepository: AudioLikeRepository,
    private readonly audioSaveRepository: AudioSaveRepository,
  ) {}

  async getAudioGuides(userId?: string): Promise<AudioGuideListItem[]> {
    try {
      const audioList = await this.audioGuideRepository.findMany(userId);
      return audioList.map((audio) => this.toListItem(audio));
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
    userId?: string,
  ): Promise<AudioGuideListItem[]> {
    try {
      const audioList =
        await this.audioGuideRepository.findManyByCategoryCode(
          categoryCode,
          userId,
        );
      return audioList.map((audio) => this.toListItem(audio));
    } catch {
      throw new AppError({
        code: AUDIO_CODES.AUDIO_LIST_FAILED,
        message: AUDIO_MESSAGES.AUDIO_LIST_FAILED,
        statusCode: 500,
      });
    }
  }

  async getLikedAudioGuides(uid: string): Promise<AudioGuideListItem[]> {
    try {
      const audioList =
        await this.audioGuideRepository.findManyLikedByUser(uid);
      return audioList.map((audio) => this.toListItem(audio));
    } catch {
      throw new AppError({
        code: AUDIO_CODES.LIKED_AUDIO_LIST_FAILED,
        message: AUDIO_MESSAGES.LIKED_AUDIO_LIST_FAILED,
        statusCode: 500,
      });
    }
  }

  async getSavedAudioGuides(uid: string): Promise<AudioGuideListItem[]> {
    try {
      const audioList =
        await this.audioGuideRepository.findManySavedByUser(uid);
      return audioList.map((audio) => this.toListItem(audio));
    } catch {
      throw new AppError({
        code: AUDIO_CODES.SAVED_AUDIO_LIST_FAILED,
        message: AUDIO_MESSAGES.SAVED_AUDIO_LIST_FAILED,
        statusCode: 500,
      });
    }
  }

  async toggleAudioSave(
    audioId: bigint,
    uid: string,
  ): Promise<AudioSaveToggleResult> {
    try {
      const audio = await this.audioGuideRepository.findById(audioId);
      if (!audio) {
        throw new AppError({
          code: AUDIO_CODES.AUDIO_GUIDE_NOT_FOUND,
          message: AUDIO_MESSAGES.AUDIO_GUIDE_NOT_FOUND,
          statusCode: 404,
        });
      }

      const isSaved = await this.audioSaveRepository.toggle(audioId, uid);
      return {
        audioId: Number(audioId),
        isSaved,
        fileUrl: getSignedAudioUrl(audio.audioKey, audio.audioUrl),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        code: AUDIO_CODES.AUDIO_SAVE_FAILED,
        message: AUDIO_MESSAGES.AUDIO_SAVE_FAILED,
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
      savedBy?: { saveId: bigint }[];
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
      isSaved: (audio.savedBy?.length ?? 0) > 0,
    };
  }
}

export const audioService = new AudioService(
  audioGuideRepository,
  audioLikeRepository,
  audioSaveRepository,
);
