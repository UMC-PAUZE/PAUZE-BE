import { AppError } from "../../../common/errors/app.error.js";
import { deleteObject } from "../../../common/utils/s3.util.js";
import type { VisualGuideDeleteResult, VisualGuideFileResponse } from "../dto/visual.dto.js";
import { type VisualGuideRepository, visualGuideRepository } from "../repository/visual.repository.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";

export class VisualGuideService {
  constructor(
    private readonly visualGuideRepository: VisualGuideRepository,
    private readonly deleteVisualObject: (key: string) => Promise<void> = deleteObject,
  ) {}

  async getVisualGuide(): Promise<VisualGuideFileResponse> {
    const visual = await this.visualGuideRepository.findCurrent();

    if (visual) {
      return {
        visualUrl: visual.visualUrl,
      };
    }

    throw new AppError({
      code: VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND,
      message: VISUAL_MESSAGES.VISUAL_GUIDE_NOT_FOUND,
      statusCode: 404,
    });
  }

  async deleteVisualGuide(): Promise<VisualGuideDeleteResult> {
    try {
      const visual = await this.visualGuideRepository.findCurrent();
      if (!visual) {
        throw new AppError({
          code: VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND,
          message: VISUAL_MESSAGES.VISUAL_GUIDE_NOT_FOUND,
          statusCode: 404,
        });
      }

      await this.visualGuideRepository.deleteById(visual.visualId);
      try {
        await this.deleteVisualObject(visual.visualKey);
      } catch (error) {
        console.error("[VisualGuideService] S3 cleanup failed", {
          visualId: visual.visualId.toString(),
          visualKey: visual.visualKey,
          error,
        });
      }

      return { visualId: Number(visual.visualId) };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        code: VISUAL_CODES.DELETE_FAILED,
        message: VISUAL_MESSAGES.DELETE_FAILED,
        statusCode: 500,
      });
    }
  }
}

export const visualGuideService = new VisualGuideService(visualGuideRepository);
