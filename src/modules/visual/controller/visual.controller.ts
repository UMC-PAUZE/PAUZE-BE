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
import type { VisualGuideFileResponse } from "../dto/visual.dto.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import { visualGuideService } from "../service/visual.service.js"
import { AppError } from "../../../common/errors/app.error.js";

function parseVisualKey(key: string): string {
    const visualKey = key.trim();

    if(!visualKey) {
        throw new AppError({
            code: VISUAL_CODES.BAD_REQUEST,
            message: VISUAL_MESSAGES.BAD_REQUEST,
            statusCode: 400,
        });
    }
    return visualKey;
}

@Route("visual-guides")
@Tags("Visual Guides")
export class VisualController extends Controller {
    @Get("file")
    @SuccessResponse(200,"OK")
    public async getGuideByKey(@Query() key: string,): Promise<ApiSuccessResponse<VisualGuideFileResponse>> {
        const result = await visualGuideService.getVisualGuideByKey(parseVisualKey(key));
        return success(
            VISUAL_CODES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            VISUAL_MESSAGES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            result,
        )

    }
}