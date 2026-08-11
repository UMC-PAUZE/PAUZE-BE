import {
  buildAudioKey,
  deleteObject,
  uploadObject,
} from "../../../common/utils/s3.util.js";
import { AppError } from "../../../common/errors/app.error.js";
import type { AudioUploadResult } from "../dto/audio-upload.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";
import {
  type AudioUploadRepositoryContract,
  audioUploadRepository,
} from "../repository/audio-upload.repository.js";
import {
  isAllowedAudioFile,
  normalizeAudioTitle,
  parseAudioCategoryId,
} from "../utils/audio-file.util.js";

export interface AudioObjectStorage {
  buildKey(originalFilename: string): string;
  upload(params: {
    key: string;
    body: Buffer;
    filename: string;
    contentType: string;
  }): Promise<{ key: string; url: string }>;
  delete(key: string): Promise<void>;
}

const s3AudioStorage: AudioObjectStorage = {
  buildKey: buildAudioKey,
  upload: uploadObject,
  delete: deleteObject,
};

export class AudioUploadService {
  constructor(
    private readonly repository: AudioUploadRepositoryContract,
    private readonly storage: AudioObjectStorage,
  ) {}

  async upload(params: {
    audioFile?: Express.Multer.File;
    audioTitle: string;
    categoryId: string;
  }): Promise<AudioUploadResult> {
    const title = normalizeAudioTitle(params.audioTitle);
    const categoryId = parseAudioCategoryId(params.categoryId);
    if (
      !params.audioFile ||
      !isAllowedAudioFile(params.audioFile) ||
      !title ||
      !categoryId
    ) {
      throw new AppError({
        code: AUDIO_CODES.AUDIO_FILE_INVALID,
        message: AUDIO_MESSAGES.AUDIO_FILE_INVALID,
        statusCode: 400,
      });
    }

    let uploadedKey: string | null = null;
    try {
      if (!(await this.repository.categoryExists(categoryId))) {
        throw new AppError({
          code: AUDIO_CODES.AUDIO_CATEGORY_NOT_FOUND,
          message: AUDIO_MESSAGES.AUDIO_CATEGORY_NOT_FOUND,
          statusCode: 404,
        });
      }

      const key = this.storage.buildKey(params.audioFile.originalname);
      const uploaded = await this.storage.upload({
        key,
        body: params.audioFile.buffer,
        filename: params.audioFile.originalname,
        contentType: params.audioFile.mimetype,
      });
      uploadedKey = uploaded.key;

      const created = await this.repository.create({
        audioTitle: title,
        categoryId,
        audioKey: uploaded.key,
        audioUrl: uploaded.url,
        createdAt: new Date(),
      });

      return {
        audioId: Number(created.audioId),
        audioTitle: created.audioTitle,
        categoryId: Number(created.categoryId),
        audioUrl: created.audioUrl,
        createdAt: created.createdAt.toISOString(),
      };
    } catch (error) {
      if (uploadedKey) {
        try {
          await this.storage.delete(uploadedKey);
        } catch {
          // best-effort rollback, matching profile image handling
        }
      }
      if (error instanceof AppError) throw error;
      throw new AppError({
        code: AUDIO_CODES.UPLOAD_FAILED,
        message: AUDIO_MESSAGES.UPLOAD_FAILED,
        statusCode: 500,
      });
    }
  }
}

export const audioUploadService = new AudioUploadService(
  audioUploadRepository,
  s3AudioStorage,
);
