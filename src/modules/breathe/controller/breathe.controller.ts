import type { Request as ExpressRequest } from "express";
import {
  Controller,
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
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../../../common/responses/response.js";
import { success } from "../../../common/responses/response.js";
import { requireAdmin } from "../../../common/utils/authorization.util.js";
import type {
  BreatheGuideFileResponse,
  BreatheGuideUploadResult,
} from "../dto/breathe.dto.js";
import { BREATHE_CODES, BREATHE_MESSAGES } from "../errors/breathe.errors.js";
import { breatheGuideUploadService } from "../service/breathe-upload.service.js";
import { breatheGuideService } from "../service/breathe.service.js";

@Route("breathe-guides")
@Tags("Breathe Guides")
export class BreatheController extends Controller {
  /**
   * Multipart 오디오 파일을 S3에 업로드하고 단일 호흡 가이드를 등록하거나 교체합니다.
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
    /** 업로드할 호흡 가이드용 오디오 파일. 최대 20MB이며 mp3, wav, m4a, aac, ogg, flac 형식을 지원합니다. */
    @UploadedFile() breatheFile: Express.Multer.File,
  ): Promise<ApiSuccessResponse<BreatheGuideUploadResult>> {
    requireAdmin(request);

    const result = await breatheGuideUploadService.upload({ breatheFile });
    return success(
      BREATHE_CODES.UPLOAD_SUCCESS,
      BREATHE_MESSAGES.UPLOAD_SUCCESS,
      result,
    );
  }

  /** 등록된 단일 호흡 가이드 오디오 파일의 URL을 조회합니다. */
  @Get("file")
  @SuccessResponse(200, "OK")
  @Response<ApiErrorResponse>(404, "Not Found", {
    isSuccess: false,
    code: BREATHE_CODES.BREATHE_GUIDE_NOT_FOUND,
    message: BREATHE_MESSAGES.BREATHE_GUIDE_NOT_FOUND,
    result: null,
  })
  public async getGuide(): Promise<ApiSuccessResponse<BreatheGuideFileResponse>> {
    const result = await breatheGuideService.getBreatheGuide();
    return success(
      BREATHE_CODES.GET_BREATHE_GUIDE_FILE_SUCCESS,
      BREATHE_MESSAGES.GET_BREATHE_GUIDE_FILE_SUCCESS,
      result,
    );
  }
}
