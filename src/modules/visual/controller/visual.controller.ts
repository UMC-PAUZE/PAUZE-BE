import type { Request as ExpressRequest } from "express";
import {
    Controller,
    Delete,
    FormField,
    Get,
    Post,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
    UploadedFile,
} from "tsoa";
import { requireAdmin } from "../../../common/utils/authorization.util.js";
import { success } from "../../../common/responses/response.js";
import type {
    ApiErrorResponse,
    ApiSuccessResponse,
} from "../../../common/responses/response.js";
import type { VisualGuideDeleteResult, VisualGuideFileResponse, VisualGuideUploadResult } from "../dto/visual.dto.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";
import { visualGuideService } from "../service/visual.service.js"
import { visualGuideUploadService } from "../service/visual-upload.service.js";

@Route("visual-guides")
@Tags("Visual Guides")
export class VisualController extends Controller {
    /**
     * Multipart 오디오 파일을 S3에 업로드하고 단일 시각 안정 가이드를 등록하거나 교체합니다.
     * 반환되는 visualUrl은 visual_guide.visual_url에 저장된 URL입니다.
     */
    @Post("upload")
    @Security("bearer")
    @SuccessResponse(200, "OK")
    @Response<ApiErrorResponse>(400, "Bad Request")
    @Response<ApiErrorResponse>(401, "Unauthorized")
    @Response<ApiErrorResponse>(403, "Forbidden")
    @Response<ApiErrorResponse>(500, "Internal Server Error")
    public async uploadGuide(
        @Request() request: ExpressRequest,
        /** 업로드할 시각 안정용 오디오 파일. mp3, wav, m4a, aac, ogg, flac 형식을 지원합니다. */
        @UploadedFile() visualFile: Express.Multer.File,
        /** 시각 안정 가이드 제목. 1자 이상 50자 이하 */
        @FormField() visualTitle: string,
        /** 선택 설명. 최대 100자 */
        @FormField() content?: string,
    ): Promise<ApiSuccessResponse<VisualGuideUploadResult>> {
        requireAdmin(request);

        const result = await visualGuideUploadService.upload({
            visualFile,
            visualTitle,
            content,
        });
        return success(
            VISUAL_CODES.UPLOAD_SUCCESS,
            VISUAL_MESSAGES.UPLOAD_SUCCESS,
            result,
        );
    }

    /**
     * 등록된 단일 시각 안정 오디오 파일의 URL을 조회합니다.
     */
    @Get("file")
    @SuccessResponse(200,"OK")
    @Response<ApiErrorResponse>(404, "Not Found", {
        isSuccess: false,
        code: VISUAL_CODES.VISUAL_GUIDE_NOT_FOUND,
        message: VISUAL_MESSAGES.VISUAL_GUIDE_NOT_FOUND,
        result: null,
    })
    public async getGuide(): Promise<ApiSuccessResponse<VisualGuideFileResponse>> {
        const result = await visualGuideService.getVisualGuide();
        return success(
            VISUAL_CODES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            VISUAL_MESSAGES.GET_VISUAL_GUIDE_FILE_SUCCESS,
            result,
        )

    }


    /**
     * 시각 안정 오디오를 DB에서 삭제한 뒤 visualKey로 S3 객체 삭제를 시도합니다.
     * DB 삭제 이후의 S3 정리 실패는 성공 응답에 영향을 주지 않습니다.
     */
    @Delete("file")
    @Security("bearer")
    @SuccessResponse(200, "OK")
    @Response<ApiErrorResponse>(401, "Unauthorized")
    @Response<ApiErrorResponse>(403, "Forbidden")
    @Response<ApiErrorResponse>(404, "Not Found")
    @Response<ApiErrorResponse>(500, "Internal Server Error")
    public async deleteGuide(
        @Request() request: ExpressRequest,
    ): Promise<ApiSuccessResponse<VisualGuideDeleteResult>> {
        requireAdmin(request);
        const result = await visualGuideService.deleteVisualGuide();
        return success(VISUAL_CODES.DELETE_SUCCESS, VISUAL_MESSAGES.DELETE_SUCCESS, result);
    }
}
