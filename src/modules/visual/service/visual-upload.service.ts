import { AppError } from "../../../common/errors/app.error.js";
import {
  getUploadedFileBody,
  type UploadBody,
} from "../../../common/utils/uploaded-file.util.js";
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
    body: UploadBody;
    contentLength: number;
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
  }): Promise<VisualGuideUploadResult> {
    if (!params.visualFile || !isAllowedAudioFile(params.visualFile)) {
      throw new AppError({
        code: VISUAL_CODES.BAD_REQUEST,
        message: VISUAL_MESSAGES.BAD_REQUEST,
        statusCode: 400,
      });
    }
    const visualFile = params.visualFile;

    const key = this.storage.buildKey(visualFile.originalname);
    let uploadedKey: string | null = null;
    try {
      const uploaded = await this.storage.upload({
        key,
        body: getUploadedFileBody(visualFile),
        contentLength: visualFile.size,
        filename: visualFile.originalname,
        contentType: visualFile.mimetype,
      });
      uploadedKey = uploaded.key;

      return await this.repository.withMutationLock(async (repository) => {
        const previous = await repository.findCurrent();
        const created = await repository.saveCurrent({
          visualId: previous?.visualId,
          visualKey: uploaded.key,
          visualUrl: uploaded.url,
          createdAt: new Date(),
        });

        if (previous?.visualKey && previous.visualKey !== uploaded.key) {
          await repository.enqueueCleanup(previous.visualKey);
        }

        return {
          visualId: Number(created.visualId),
          visualUrl: created.visualUrl,
          createdAt: created.createdAt.toISOString(),
        };
      });
    } catch (error) {
      if (uploadedKey) {
        try {
          await this.storage.delete(uploadedKey);
        } catch (deleteError) {
          try {
            await this.repository.enqueueCleanup(uploadedKey);
          } catch (enqueueError) {
            console.error(
              "[VisualGuide] orphaned S3 object cleanup registration failed",
              {
                objectKey: uploadedKey,
                deleteError,
                enqueueError,
              },
            );
          }
        }
      }
      if (error instanceof AppError) throw error;
      throw new AppError({
        code: VISUAL_CODES.UPLOAD_FAILED,
        message: VISUAL_MESSAGES.UPLOAD_FAILED,
        statusCode: 500,
      });
    }
  }
}

export const visualGuideUploadService = new VisualGuideUploadService(
  visualGuideRepository,
  s3VisualStorage,
);
