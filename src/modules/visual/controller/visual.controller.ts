import {
    Controller,
    Get,
    Query,
    Route,
    SuccessResponse,
    Tags,
} from "tsoa";
import { success } from "../../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../../common/responses/response.js";
import type { VisualGuideFileResponse, VisualGuideItem } from "../dto/visual.dto.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import { visualGuideService } from "../service/visual.service.js"
import { AppError } from "../../../common/errors/app.error.js";

@Route("visual-guides")
@Tags("Visual Guides")
export class VisualController extends Controller {
    @Get("/")
    @SuccessResponse(200,"OK")
    public async getAllGuides(): Promise<ApiSuccessResponse<VisualGuideItem[]>> {
        const result = await visualGuideService.getVisualGuides();
        return success(
            VISUAL_CODES.GET_VISUAL_GUIDES_SUCCESS,
            VISUAL_MESSAGES.GET_VISUAL_GUIDES_SUCCESS,
            result,
        );
    }

    @Get("file")
    @SuccessResponse(200,"OK")
    public async getGuideByKey(@Query() key: string,): Promise<ApiSuccessResponse<VisualGuideFileResponse>> {
        const result = await visualGuideService.getVisualGuideByKey(key);
        return success(
            VISUAL_CODES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            VISUAL_MESSAGES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            result,
        )

    }
}