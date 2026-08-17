import type { Request as ExpressRequest } from "express";
import {
  Controller,
  FormField,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
  UploadedFile,
} from "tsoa";
import type { AudioCategoryCode } from "../../../generated/prisma/client.js";
import { requireAdmin } from "../../../common/utils/authorization.util.js";
import { success } from "../../../common/responses/response.js";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../../../common/responses/response.js";
import type { AudioUploadResult } from "../dto/audio-upload.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";
import { audioUploadService } from "../service/audio-upload.service.js";

@Route("audio-guides")
@Tags("Audio Guides")
export class AudioUploadController extends Controller {
  /**
   * Multipart 오디오 파일을 S3에 업로드하고 청각 안정 가이드를 등록합니다.
   * 반환되는 audioUrl은 audio_guide.audio_url에 저장된 URL입니다.
   */
  @Post("upload")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response<ApiErrorResponse>(400, "Bad Request")
  @Response<ApiErrorResponse>(401, "Unauthorized")
  @Response<ApiErrorResponse>(403, "Forbidden")
  @Response<ApiErrorResponse>(404, "Category Not Found")
  @Response<ApiErrorResponse>(500, "Internal Server Error")
  public async uploadAudio(
    @Request() request: ExpressRequest,
    /** 업로드할 오디오 파일. 최대 20MB이며 mp3, wav, m4a, aac, ogg, flac 형식을 지원합니다. */
    @UploadedFile() audioFile: Express.Multer.File,
    /** 오디오 제목. 1자 이상 50자 이하입니다. */
    @FormField() audioTitle: string,
    /** 오디오 카테고리 코드. NATURE_SOUND, ASMR, NOISE 중 하나입니다. */
    @FormField() categoryCode: AudioCategoryCode,
  ): Promise<ApiSuccessResponse<AudioUploadResult>> {
    requireAdmin(request);

    const result = await audioUploadService.upload({
      audioFile,
      audioTitle,
      categoryCode,
    });
    return success(
      AUDIO_CODES.UPLOAD_SUCCESS,
      AUDIO_MESSAGES.UPLOAD_SUCCESS,
      result,
    );
  }
}
