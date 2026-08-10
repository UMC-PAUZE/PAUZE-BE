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
  AudioCursorPagination,
  AudioGuideCursorPage,
  AudioLikeToggleResult,
} from "../dto/audio.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";
import { audioService } from "../service/audio.service.js";
import { parseAudioCategoryCode } from "../utils/audio-category.util.js";

function parseAudioId(audioId: string): bigint {
  if (!/^\d+$/.test(audioId)) {
    throw new AppError({
      code: AUDIO_CODES.INVALID_PAGINATION,
      message: AUDIO_MESSAGES.INVALID_PAGINATION,
      statusCode: 400,
    });
  }

  const parsed = BigInt(audioId);
  if (parsed < 1n) {
    throw new AppError({
      code: AUDIO_CODES.INVALID_PAGINATION,
      message: AUDIO_MESSAGES.INVALID_PAGINATION,
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

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;

function parsePagination(
  cursor?: string,
  size?: number,
): AudioCursorPagination {
  if (cursor !== undefined && (!/^\d+$/.test(cursor) || BigInt(cursor) < 1n)) {
    throw new AppError({
      code: AUDIO_CODES.BAD_REQUEST,
      message: AUDIO_MESSAGES.BAD_REQUEST,
      statusCode: 400,
    });
  }

  const parsedSize = size ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(parsedSize) || parsedSize < 1 || parsedSize > MAX_PAGE_SIZE) {
    throw new AppError({
      code: AUDIO_CODES.BAD_REQUEST,
      message: AUDIO_MESSAGES.BAD_REQUEST,
      statusCode: 400,
    });
  }

  return {
    cursor: cursor === undefined ? undefined : BigInt(cursor),
    size: parsedSize,
  };
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
    @Query() cursor?: string,
    @Query() size?: number,
  ): Promise<ApiSuccessResponse<AudioGuideCursorPage>> {
    const result = await audioService.getAudioGuides(
      parsePagination(cursor, size),
      request.user?.uid,
    );
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
    @Query() cursor?: string,
    @Query() size?: number,
  ): Promise<ApiSuccessResponse<AudioGuideCursorPage>> {
    const result = await audioService.getAudioGuidesByCategory(
      parseAudioCategoryCode(categoryCode),
      parsePagination(cursor, size),
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
    @Query() cursor?: string,
    @Query() size?: number,
  ): Promise<ApiSuccessResponse<AudioGuideCursorPage>> {
    const result = await audioService.getLikedAudioGuides(
      requireUid(request),
      parsePagination(cursor, size),
    );
    return success(
      AUDIO_CODES.GET_LIKED_AUDIO_GUIDES_SUCCESS,
      AUDIO_MESSAGES.GET_LIKED_AUDIO_GUIDES_SUCCESS,
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
