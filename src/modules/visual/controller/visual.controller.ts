import {
    Controller,
    Get,
    Query,
    Response,
    Route,
    SuccessResponse,
    Tags,
} from "tsoa";
import { success } from "../../../common/responses/response.js";
import type {
    ApiErrorResponse,
    ApiSuccessResponse,
} from "../../../common/responses/response.js";
import type { VisualGuideFileResponse } from "../dto/visual.dto.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import { visualGuideService } from "../service/visual.service.js"
import { parseVisualKey } from "../utils/visual-key.util.js";

@Route("visual-guides")
@Tags("Visual Guides")
export class VisualController extends Controller {
    @Get("file")
    @SuccessResponse(200,"OK")
    @Response<ApiErrorResponse>(400, "Bad Request", {
        isSuccess: false,
        code: VISUAL_CODES.BAD_REQUEST,
        message: VISUAL_MESSAGES.BAD_REQUEST,
        result: null,
    })
    @Response<ApiErrorResponse>(404, "Not Found", {
        isSuccess: false,
        code: VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND,
        message: VISUAL_MESSAGES.VISUAL_GUIDE_NOT_FOUND,
        result: null,
    })
    public async getGuideByKey(@Query() key: string,): Promise<ApiSuccessResponse<VisualGuideFileResponse>> {
        const result = await visualGuideService.getVisualGuideByKey(parseVisualKey(key));
        return success(
            VISUAL_CODES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            VISUAL_MESSAGES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            result,
        )

    }
}
