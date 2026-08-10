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
    /**
     * 시각 안정 가이드 키에 해당하는 파일 URL을 조회합니다.
     * key는 시각 가이드를 구분하는 고유 식별자이며, 응답 URL은 프론트에서 파일 재생 또는 다운로드에 사용합니다.
     */
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
    public async getGuideByKey(
        /** 조회할 시각 안정 가이드의 고유 키입니다. */
        @Query() key: string,
    ): Promise<ApiSuccessResponse<VisualGuideFileResponse>> {
        const result = await visualGuideService.getVisualGuideByKey(parseVisualKey(key));
        return success(
            VISUAL_CODES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            VISUAL_MESSAGES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            result,
        )

    }
}
