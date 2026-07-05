import { AppError } from "../../../common/errors/app.error.js";
import type {
  AudioCategoryCode,
  AudioGuideListItem,
  AudioLikeToggleResult,
  AudioSaveResult,
} from "../dto/audio.dto.js";
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
    const audioList = await this.audioGuideRepository.findMany(userId);
    return audioList.map((audio) => this.toListItem(audio, userId));
  }

  async getAudioGuidesByCategory(
    categoryCode: AudioCategoryCode,
    userId?: string,
  ): Promise<AudioGuideListItem[]> {
    const audioList =
      await this.audioGuideRepository.findManyByCategoryCode(
        categoryCode,
        userId,
      );
    return audioList.map((audio) => this.toListItem(audio, userId));
  }

  async saveAudioGuide(audioId: bigint, uid: string): Promise<AudioSaveResult> {
    const audio = await this.audioGuideRepository.findById(audioId);
    if (!audio) {
      throw new AppError({
        code: AUDIO_CODES.AUDIO_GUIDE_NOT_FOUND,
        message: AUDIO_MESSAGES.AUDIO_GUIDE_NOT_FOUND,
        statusCode: 404,
      });
    }

    const existing = await this.audioSaveRepository.findByAudioIdAndUid(
      audioId,
      uid,
    );
    if (!existing) {
      try {
        await this.audioSaveRepository.create(audioId, uid);
      } catch {
        throw new AppError({
          code: AUDIO_CODES.AUDIO_SAVE_FAILED,
          message: AUDIO_MESSAGES.AUDIO_SAVE_FAILED,
          statusCode: 500,
        });
      }
    }

    return {
      audioId: Number(audioId),
      isSaved: true,
      audioUrl: getSignedAudioUrl(audio.audioKey, audio.audioUrl),
    };
  }

  async toggleAudioLike(
    audioId: bigint,
    uid: string,
  ): Promise<AudioLikeToggleResult> {
    const audio = await this.audioGuideRepository.findById(audioId);
    if (!audio) {
      throw new AppError({
        code: AUDIO_CODES.AUDIO_GUIDE_NOT_FOUND,
        message: AUDIO_MESSAGES.AUDIO_GUIDE_NOT_FOUND,
        statusCode: 404,
      });
    }

    const likeRecord = await this.audioLikeRepository.findByAudioIdAndUid(
      audioId,
      uid,
    );

    if (likeRecord) {
      await this.audioLikeRepository.delete(likeRecord.likedId);
      return { audioId: Number(audioId), isLiked: false };
    }

    await this.audioLikeRepository.create(audioId, uid);
    return { audioId: Number(audioId), isLiked: true };
  }

  private toListItem(
    audio: {
      audioId: bigint;
      audioTitle: string;
      audioUrl: string;
      categoryId: bigint;
      category: { categoryName: string };
      likedBy?: { likedId: bigint }[];
    },
    userId?: string,
  ): AudioGuideListItem {
    const base = {
      audioId: Number(audio.audioId),
      audioTitle: audio.audioTitle,
      categoryId: Number(audio.categoryId),
      categoryName: audio.category.categoryName,
      fileUrl: audio.audioUrl,
    };

    if (!userId) {
      return base;
    }

    return {
      ...base,
      isLiked: (audio.likedBy?.length ?? 0) > 0,
    };
  }
}

export const audioService = new AudioService(
  audioGuideRepository,
  audioLikeRepository,
  audioSaveRepository,
);
