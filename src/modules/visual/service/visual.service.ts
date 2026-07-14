import { AppError } from "../../../common/errors/app.error.js";
import type { VisualGuideFileResponse, VisualGuideItem } from "../dto/visual.dto.js";
import { type VisualGuideRepository, visualGuideRepository } from "../repository/visual.repository.js"
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import { getSignedVisualUrl } from "./visual-s3.stub.js";

export class VisualGuideService {
    constructor(private readonly visualGuideRepository: VisualGuideRepository) {}
    
    async getVisualGuides(): Promise<VisualGuideItem[]> {
        const visualList = await this.visualGuideRepository.findMany();
        return visualList.map((visual) => ({
            visualId: visual.visualId.toString(),
            visualTitle: visual.visualTitle,
            visualContent: visual.visualContent,
            fileUrl: visual.visualUrl,
        }));
    }
    
    async getVisualGuideByKey(visualKey: string): Promise<VisualGuideFileResponse> {
        const visual = await this.visualGuideRepository.findByKey(visualKey);

        if (!visual) {
            throw new AppError({
                code: VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND,
                message: VISUAL_MESSAGES.VISUAL_GUIDE_NOT_FOUND,
                statusCode: 404,
            })
        }
        return {
            visualKey: visual.visualKey,
            fileUrl: getSignedVisualUrl(visual.visualKey, visual.visualUrl),
        };
    }
}

export const visualGuideService = new VisualGuideService(visualGuideRepository);