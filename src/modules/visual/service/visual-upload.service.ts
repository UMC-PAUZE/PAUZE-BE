import { AppError } from "../../../common/errors/app.error.js";
import {
  buildVisualKey,
  deleteObject,
  uploadObject,
} from "../../../common/utils/s3.util.js";
import type { VisualGuideUploadResult } from "../dto/visual.dto.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import {
  type VisualGuideRepository,
  visualGuideRepository,
} from "../repository/visual.repository.js";
import { isAllowedAudioFile } from "../../audio/utils/audio-file.util.js";

export interface VisualObjectStorage {
  buildKey(originalFilename: string): string;
  upload(params: {
    key: string;
    body: Buffer;
    filename: string;
    contentType: string;
  }): Promise<{ key: string; url: string }>;
  delete(key: string): Promise<void>;
}

const s3VisualStorage: VisualObjectStorage = {
  buildKey: buildVisualKey,
  upload: uploadObject,
  delete: deleteObject,
};

export class VisualGuideUploadService {
  constructor(
    private readonly repository: VisualGuideRepository,
    private readonly storage: VisualObjectStorage,
  ) {}

  async upload(params: {
    visualFile?: Express.Multer.File;
    visualTitle: string;
    content?: string;
  }): Promise<VisualGuideUploadResult> {
    const visualTitle = params.visualTitle.trim();
    const content = params.content?.trim() || null;
    if (
      !params.visualFile ||
      !isAllowedAudioFile(params.visualFile) ||
      visualTitle.length < 1 ||
      visualTitle.length > 50 ||
      (content !== null && content.length > 100)
    ) {
      throw new AppError({
        code: VISUAL_CODES.BAD_REQUEST,
        message: VISUAL_MESSAGES.BAD_REQUEST,
        statusCode: 400,
      });
    }
    const visualFile = params.visualFile;

    return this.repository.withMutationLock(async (repository) => {
      let uploadedKey: string | null = null;
      try {
      const previous = await repository.findCurrent();

      const key = this.storage.buildKey(visualFile.originalname);
      const uploaded = await this.storage.upload({
        key,
        body: visualFile.buffer,
        filename: visualFile.originalname,
        contentType: visualFile.mimetype,
      });
      uploadedKey = uploaded.key;

      const created = await repository.saveCurrent({
        visualId: previous?.visualId,
        visualKey: uploaded.key,
        visualTitle,
        content,
        visualUrl: uploaded.url,
        createdAt: new Date(),
      });

      if (previous?.visualKey && previous.visualKey !== uploaded.key) {
        await repository.enqueueCleanup(previous.visualKey);
      }

      return {
        visualId: Number(created.visualId),
        visualTitle: created.visualTitle,
        visualUrl: created.visualUrl,
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
        code: VISUAL_CODES.UPLOAD_FAILED,
        message: VISUAL_MESSAGES.UPLOAD_FAILED,
        statusCode: 500,
      });
      }
    });
  }
}

export const visualGuideUploadService = new VisualGuideUploadService(
  visualGuideRepository,
  s3VisualStorage,
);
