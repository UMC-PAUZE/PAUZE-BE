import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import { AppError } from "../../../common/errors/app.error.js";
import { success } from "../../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../../common/responses/response.js";
import type {
  AudioCategoryCode,
  AudioGuideListItem,
  AudioLikeToggleResult,
  AudioSaveResult,
} from "../dto/audio.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";
import { audioService } from "../service/audio.service.js";

function parseAudioId(audioId: string): bigint {
  if (!/^\d+$/.test(audioId)) {
    throw new AppError({
      code: AUDIO_CODES.BAD_REQUEST,
      message: AUDIO_MESSAGES.BAD_REQUEST,
      statusCode: 400,
    });
  }

  const parsed = BigInt(audioId);
  if (parsed < 1n) {
    throw new AppError({
      code: AUDIO_CODES.BAD_REQUEST,
      message: AUDIO_MESSAGES.BAD_REQUEST,
      statusCode: 400,
    });
  }

  return parsed;
}

@Route("audio-guides")
@Tags("Audio Guides")
export class AudioController extends Controller {
  @Get("/")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  public async getAllGuides(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<AudioGuideListItem[]>> {
    const result = await audioService.getAudioGuides(request.user?.uid);
    return success(
      AUDIO_CODES.GET_AUDIO_GUIDES_SUCCESS,
      AUDIO_MESSAGES.GET_AUDIO_GUIDES_SUCCESS,
      result,
    );
  }

  @Get("categories")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  public async getAudioGuidesByCategory(
    @Request() request: ExpressRequest,
    @Query() categoryCode: AudioCategoryCode,
  ): Promise<ApiSuccessResponse<AudioGuideListItem[]>> {
    const result = await audioService.getAudioGuidesByCategory(
      categoryCode,
      request.user?.uid,
    );
    return success(
      AUDIO_CODES.GET_AUDIO_GUIDES_BY_CATEGORY_SUCCESS,
      AUDIO_MESSAGES.GET_AUDIO_GUIDES_BY_CATEGORY_SUCCESS,
      result,
    );
  }

  @Post("{audioId}/saves")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  @Response(500, "Internal Server Error")
  public async saveAudioGuide(
    @Request() request: ExpressRequest,
    @Path() audioId: string,
  ): Promise<ApiSuccessResponse<AudioSaveResult>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: "AUTH_UNAUTHORIZED_401",
        message: "인증이 필요합니다.",
        statusCode: 401,
      });
    }

    const result = await audioService.saveAudioGuide(
      parseAudioId(audioId),
      uid,
    );
    return success(
      AUDIO_CODES.SAVE_AUDIO_GUIDE_SUCCESS,
      AUDIO_MESSAGES.SAVE_AUDIO_GUIDE_SUCCESS,
      result,
    );
  }

  @Patch("{audioId}/likes")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  public async toggleAudioLike(
    @Request() request: ExpressRequest,
    @Path() audioId: string,
  ): Promise<ApiSuccessResponse<AudioLikeToggleResult>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: "AUTH_UNAUTHORIZED_401",
        message: "인증이 필요합니다.",
        statusCode: 401,
      });
    }

    const result = await audioService.toggleAudioLike(
      parseAudioId(audioId),
      uid,
    );
    return success(
      AUDIO_CODES.TOGGLE_AUDIO_LIKE_SUCCESS,
      AUDIO_MESSAGES.TOGGLE_AUDIO_LIKE_SUCCESS,
      result,
    );
  }
}
