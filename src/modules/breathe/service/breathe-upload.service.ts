import { AppError } from "../../../common/errors/app.error.js";
import {
  getUploadedFileBody,
  type UploadBody,
} from "../../../common/utils/uploaded-file.util.js";
import {
  buildBreatheKey,
  deleteObject,
  uploadObject,
} from "../../../common/utils/s3.util.js";
import { isAllowedAudioFile } from "../../audio/utils/audio-file.util.js";
import type { BreatheGuideUploadResult } from "../dto/breathe.dto.js";
import { BREATHE_CODES, BREATHE_MESSAGES } from "../errors/breathe.errors.js";
import {
  type BreatheGuideRepository,
  breatheGuideRepository,
} from "../repository/breathe.repository.js";

export interface BreatheObjectStorage {
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

const s3BreatheStorage: BreatheObjectStorage = {
  buildKey: buildBreatheKey,
  upload: uploadObject,
  delete: deleteObject,
};

export class BreatheGuideUploadService {
  constructor(
    private readonly repository: BreatheGuideRepository,
    private readonly storage: BreatheObjectStorage,
  ) {}

  async upload(params: {
    breatheFile?: Express.Multer.File;
  }): Promise<BreatheGuideUploadResult> {
    if (!params.breatheFile || !isAllowedAudioFile(params.breatheFile)) {
      throw new AppError({
        code: BREATHE_CODES.BAD_REQUEST,
        message: BREATHE_MESSAGES.BAD_REQUEST,
        statusCode: 400,
      });
    }
    const breatheFile = params.breatheFile;
    const key = this.storage.buildKey(breatheFile.originalname);
    let uploadedKey: string | null = null;

    try {
      const uploaded = await this.storage.upload({
        key,
        body: getUploadedFileBody(breatheFile),
        contentLength: breatheFile.size,
        filename: breatheFile.originalname,
        contentType: breatheFile.mimetype,
      });
      uploadedKey = uploaded.key;

      return await this.repository.withMutationLock(async (repository) => {
        const previous = await repository.findCurrent();
        const created = await repository.saveCurrent({
          breatheId: previous?.breatheId,
          breatheKey: uploaded.key,
          breatheUrl: uploaded.url,
          createdAt: new Date(),
        });

        if (previous?.breatheKey && previous.breatheKey !== uploaded.key) {
          await repository.enqueueCleanup(previous.breatheKey);
        }

        return {
          breatheId: Number(created.breatheId),
          breatheUrl: created.breatheUrl,
          createdAt: created.createdAt.toISOString(),
        };
      });
    } catch (error) {
      if (uploadedKey) {
        try {
          await this.storage.delete(uploadedKey);
        } catch {
          // best-effort rollback, matching visual guide handling
        }
      }
      if (error instanceof AppError) throw error;
      throw new AppError({
        code: BREATHE_CODES.UPLOAD_FAILED,
        message: BREATHE_MESSAGES.UPLOAD_FAILED,
        statusCode: 500,
      });
    }
  }
}

export const breatheGuideUploadService = new BreatheGuideUploadService(
  breatheGuideRepository,
  s3BreatheStorage,
);
