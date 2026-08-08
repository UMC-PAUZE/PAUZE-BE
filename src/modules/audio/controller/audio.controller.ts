import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Get,
  Patch,
  Path,
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
import {
  AUTH_CODES,
  AUTH_MESSAGES,
} from "../../auth/errors/auth.errors.js";
import type {
  AudioGuideListItem,
  AudioLikeToggleResult,
  AudioSaveToggleResult,
} from "../dto/audio.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";
import { audioService } from "../service/audio.service.js";
import { parseAudioCategoryCode } from "../utils/audio-category.util.js";

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

function requireUid(request: ExpressRequest): string {
  const uid = request.user?.uid;
  if (!uid) {
    throw new AppError({
      code: AUTH_CODES.UNAUTHORIZED,
      message: AUTH_MESSAGES.UNAUTHORIZED,
      statusCode: 401,
    });
  }
  return uid;
}

@Route("audio-guides")
@Tags("Audio Guides")
export class AudioController extends Controller {
  @Get("/")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  @Response(500, "Internal Server Error")
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
  @Response(500, "Internal Server Error")
  public async getAudioGuidesByCategory(
    @Request() request: ExpressRequest,
    /** 필수. NATURE_SOUND, ASMR, NOISE 중 하나 */
    @Query() categoryCode?: string,
  ): Promise<ApiSuccessResponse<AudioGuideListItem[]>> {
    const result = await audioService.getAudioGuidesByCategory(
      parseAudioCategoryCode(categoryCode),
      request.user?.uid,
    );
    return success(
      AUDIO_CODES.GET_AUDIO_GUIDES_BY_CATEGORY_SUCCESS,
      AUDIO_MESSAGES.GET_AUDIO_GUIDES_BY_CATEGORY_SUCCESS,
      result,
    );
  }

  @Get("likes")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  @Response(500, "Internal Server Error")
  public async getLikedAudioGuides(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<AudioGuideListItem[]>> {
    const result = await audioService.getLikedAudioGuides(requireUid(request));
    return success(
      AUDIO_CODES.GET_LIKED_AUDIO_GUIDES_SUCCESS,
      AUDIO_MESSAGES.GET_LIKED_AUDIO_GUIDES_SUCCESS,
      result,
    );
  }

  @Get("saves")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  @Response(500, "Internal Server Error")
  public async getSavedAudioGuides(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<AudioGuideListItem[]>> {
    const result = await audioService.getSavedAudioGuides(requireUid(request));
    return success(
      AUDIO_CODES.GET_SAVED_AUDIO_GUIDES_SUCCESS,
      AUDIO_MESSAGES.GET_SAVED_AUDIO_GUIDES_SUCCESS,
      result,
    );
  }

  @Patch("{audioId}/saves")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  @Response(500, "Internal Server Error")
  public async toggleAudioSave(
    @Request() request: ExpressRequest,
    @Path() audioId: string,
  ): Promise<ApiSuccessResponse<AudioSaveToggleResult>> {
    const result = await audioService.toggleAudioSave(
      parseAudioId(audioId),
      requireUid(request),
    );
    return success(
      AUDIO_CODES.TOGGLE_AUDIO_SAVE_SUCCESS,
      AUDIO_MESSAGES.TOGGLE_AUDIO_SAVE_SUCCESS,
      result,
    );
  }

  @Patch("{audioId}/likes")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  @Response(500, "Internal Server Error")
  public async toggleAudioLike(
    @Request() request: ExpressRequest,
    @Path() audioId: string,
  ): Promise<ApiSuccessResponse<AudioLikeToggleResult>> {
    const result = await audioService.toggleAudioLike(
      parseAudioId(audioId),
      requireUid(request),
    );
    return success(
      AUDIO_CODES.TOGGLE_AUDIO_LIKE_SUCCESS,
      AUDIO_MESSAGES.TOGGLE_AUDIO_LIKE_SUCCESS,
      result,
    );
  }
}
