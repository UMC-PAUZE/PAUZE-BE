import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Delete,
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
import { requireAdmin } from "../../../common/utils/authorization.util.js";
import { success } from "../../../common/responses/response.js";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../../../common/responses/response.js";
import {
  AUTH_CODES,
  AUTH_MESSAGES,
} from "../../auth/errors/auth.errors.js";
import type {
  AudioCategoryCode,
  AudioCursorPagination,
  AudioDeleteResult,
  AudioGuideCursorPage,
  AudioLikeToggleResult,
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

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;

function parsePagination(
  cursor?: string,
  size?: number,
): AudioCursorPagination {
  if (cursor !== undefined && (!/^\d+$/.test(cursor) || BigInt(cursor) < 1n)) {
    throw new AppError({
      code: AUDIO_CODES.INVALID_PAGINATION,
      message: AUDIO_MESSAGES.INVALID_PAGINATION,
      statusCode: 400,
    });
  }

  const parsedSize = size ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(parsedSize) || parsedSize < 1 || parsedSize > MAX_PAGE_SIZE) {
    throw new AppError({
      code: AUDIO_CODES.INVALID_PAGINATION,
      message: AUDIO_MESSAGES.INVALID_PAGINATION,
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
  /**
   * 청각 안정 오디오 가이드 전체 목록을 최신순으로 조회합니다.
   * 로그인 토큰은 선택 사항이며, 인증된 경우 각 오디오의 사용자 좋아요 상태를 함께 반환합니다.
   */
  @Get("/")
  @SuccessResponse(200, "OK")
  @Response<ApiErrorResponse>(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(500, "Internal Server Error")
  public async getAllGuides(
    @Request() request: ExpressRequest,
    /** 이전 응답의 nextCursor. 첫 조회에서는 생략합니다. */
    @Query() cursor?: string,
    /** 한 번에 조회할 개수. 기본값 8, 최대 50입니다. */
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

  /**
   * 지정한 카테고리에 속한 청각 안정 오디오 가이드를 최신순으로 조회합니다.
   * 로그인 토큰은 선택 사항이며, 인증된 경우 각 오디오의 사용자 좋아요 상태를 함께 반환합니다.
   */
  @Get("categories")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(500, "Internal Server Error")
  public async getAudioGuidesByCategory(
    @Request() request: ExpressRequest,
    /** 조회할 카테고리 코드. NATURE_SOUND, ASMR, NOISE 중 하나입니다. */
    @Query() categoryCode: AudioCategoryCode,
    /** 이전 응답의 nextCursor. 첫 조회에서는 생략합니다. */
    @Query() cursor?: string,
    /** 한 번에 조회할 개수. 기본값 8, 최대 50입니다. */
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

  /**
   * 로그인한 사용자가 좋아요한 청각 안정 오디오 목록을 최신 좋아요순으로 조회합니다.
   */
  @Get("likes")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response<ApiErrorResponse>(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(500, "Internal Server Error")
  public async getLikedAudioGuides(
    @Request() request: ExpressRequest,
    /** 이전 응답의 nextCursor. 첫 조회에서는 생략합니다. */
    @Query() cursor?: string,
    /** 한 번에 조회할 개수. 기본값 8, 최대 50입니다. */
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

  /**
   * 지정한 오디오의 좋아요 상태를 토글합니다.
   * 좋아요가 없으면 생성하여 true, 이미 있으면 삭제하여 false를 반환합니다.
   */
  @Patch("{audioId}/likes")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  @Response(500, "Internal Server Error")
  public async toggleAudioLike(
    @Request() request: ExpressRequest,
    /** 좋아요 상태를 변경할 오디오 식별자입니다. */
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


  /**
   * 청각 안정 오디오를 DB에서 삭제한 뒤 저장된 audioKey로 S3 객체 삭제를 시도합니다.
   * DB 삭제 이후의 S3 정리 실패는 서버에 기록하며 성공 응답에는 영향을 주지 않습니다.
   */
  @Delete("{audioId}")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response<ApiErrorResponse>(400, "Bad Request")
  @Response<ApiErrorResponse>(401, "Unauthorized")
  @Response<ApiErrorResponse>(403, "Forbidden")
  @Response<ApiErrorResponse>(404, "Not Found")
  @Response<ApiErrorResponse>(500, "Internal Server Error")
  public async deleteAudioGuide(
    @Request() request: ExpressRequest,
    /** 삭제할 청각 오디오 식별자입니다. */
    @Path() audioId: string,
  ): Promise<ApiSuccessResponse<AudioDeleteResult>> {
    requireAdmin(request);
    const result = await audioService.deleteAudioGuide(parseAudioId(audioId));
    return success(
      AUDIO_CODES.DELETE_AUDIO_GUIDE_SUCCESS,
      AUDIO_MESSAGES.DELETE_AUDIO_GUIDE_SUCCESS,
      result,
    );
  }
}
