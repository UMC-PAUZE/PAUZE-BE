import { AppError } from "../../../common/errors/app.error.js";
import type { VisualGuideFileResponse } from "../dto/visual.dto.js";
import { type VisualGuideRepository, visualGuideRepository } from "../repository/visual.repository.js"
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import { getSignedVisualUrl, getMockVisualUrl } from "./visual-s3.stub.js";


export class VisualGuideService {
    constructor(private readonly visualGuideRepository: VisualGuideRepository) {}
    
    async getVisualGuideByKey(
  visualKey: string,
): Promise<VisualGuideFileResponse> {
  const mockFileUrl = getMockVisualUrl(visualKey);
        // 더미 URL이 있으면 DB 없이 바로 반환
        if (mockFileUrl) {
            return {
            visualKey,
            fileUrl: mockFileUrl,
            };
        }

        // 더미가 없으면 DB URL 사용
        const visual = await this.visualGuideRepository.findByKey(visualKey);

        if (!visual) {
            throw new AppError({
            code: VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND,
            message: VISUAL_MESSAGES.VISUAL_GUIDE_NOT_FOUND,
            statusCode: 404,
            });
        }

        return {
            visualKey: visual.visualKey,
            fileUrl: getSignedVisualUrl(visual.visualKey, visual.visualUrl),
        };
}
}

export const visualGuideService = new VisualGuideService(visualGuideRepository);