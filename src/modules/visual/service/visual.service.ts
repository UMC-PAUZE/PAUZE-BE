import { AppError } from "../../../common/errors/app.error.js";
import type { VisualGuideFileResponse } from "../dto/visual.dto.js";
import { type VisualGuideRepository, visualGuideRepository } from "../repository/visual.repository.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import {
  getMockVisualUrl,
  getSignedVisualUrl,
} from "./visual-s3.stub.js";

export class VisualGuideService {
  constructor(private readonly visualGuideRepository: VisualGuideRepository) {}

  async getVisualGuideByKey(
    visualKey: string,
  ): Promise<VisualGuideFileResponse> {
    const visual = await this.visualGuideRepository.findByKey(visualKey);
    const mockUrl = getMockVisualUrl(visualKey);

    if (visual) {
      return {
        visualKey: visual.visualKey,
        fileUrl: getSignedVisualUrl(visual.visualKey, visual.visualUrl),
      };
    }

    if (mockUrl) {
      return {
        visualKey,
        fileUrl: mockUrl,
      };
    }

    throw new AppError({
      code: VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND,
      message: VISUAL_MESSAGES.VISUAL_GUIDE_NOT_FOUND,
      statusCode: 404,
    });
  }
}

export const visualGuideService = new VisualGuideService(visualGuideRepository);
