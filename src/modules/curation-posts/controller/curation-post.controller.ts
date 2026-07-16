import type { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Patch,
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
  CreateCurationPostRequest,
  CreateCurationPostResult,
  CurationPostBookmarkResult,
  CurationPostDetailResult,
  CurationPostLikeResult,
  CurationPostListResult,
  MyBookmarkListResult,
  UpdateCurationPostRequest,
  UpdateCurationPostResult,
} from "../dto/curation-post.dto.js";
import {
  CURATION_POST_CODES,
  CURATION_POST_MESSAGES,
} from "../errors/curation-post.errors.js";
import { curationPostService } from "../service/curation-post.service.js";

type AuthenticatedRequest = ExpressRequest & {
  user?: {
    uid: string;
    role?: string;
  };
};

function parsePostId(postId: string): bigint {
  if (!/^\d+$/.test(postId)) {
    throw new AppError({
      code: CURATION_POST_CODES.BAD_REQUEST,
      message: CURATION_POST_MESSAGES.INVALID_POST_ID,
      statusCode: 400,
    });
  }

  const parsed = BigInt(postId);
  if (parsed < 1n) {
    throw new AppError({
      code: CURATION_POST_CODES.BAD_REQUEST,
      message: CURATION_POST_MESSAGES.INVALID_POST_ID,
      statusCode: 400,
    });
  }

  return parsed;
}

function getRequiredUid(request: AuthenticatedRequest): string {
  const uid = request.user?.uid;
  if (!uid) {
    throw new AppError({
      code: CURATION_POST_CODES.AUTH_UNAUTHORIZED,
      message: CURATION_POST_MESSAGES.AUTH_UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return uid;
}

function requireAdmin(request: AuthenticatedRequest) {
  const uid = getRequiredUid(request);
  if (request.user?.role !== "ADMIN") {
    throw new AppError({
      code: CURATION_POST_CODES.FORBIDDEN,
      message: CURATION_POST_MESSAGES.FORBIDDEN,
      statusCode: 403,
    });
  }

  return uid;
}

function validatePageQuery(page: number, size: number) {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1) {
    throw new AppError({
      code: CURATION_POST_CODES.BAD_REQUEST,
      message: CURATION_POST_MESSAGES.BAD_REQUEST,
      statusCode: 400,
    });
  }
}

@Route("curation-posts")
@Tags("Curation Posts")
export class CurationPostController extends Controller {
  @Get("/")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  public async getCurationPosts(
    @Request() request: AuthenticatedRequest,
    @Query() categoryId?: number,
    @Query() keyword?: string,
    @Query() page = 1,
    @Query() size = 10,
  ): Promise<ApiSuccessResponse<CurationPostListResult>> {
    if (categoryId !== undefined && (!Number.isInteger(categoryId) || categoryId < 1)) {
      throw new AppError({
        code: "BAD_REQUEST_400",
        message: "잘못된 요청 파라미터 형식입니다.",
        statusCode: 400,
      });
    }

    validatePageQuery(page, size);

    const result = await curationPostService.getCurationPosts({
      categoryId,
      keyword,
      page,
      size,
      userId: request.user?.uid,
    });
    return success(
      CURATION_POST_CODES.GET_CURATION_POSTS_SUCCESS,
      CURATION_POST_MESSAGES.GET_CURATION_POSTS_SUCCESS,
      result,
    );
  }

  @Get("{postId}")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(404, "Not Found")
  public async getCurationPostDetail(
    @Request() request: AuthenticatedRequest,
    @Path() postId: string,
  ): Promise<ApiSuccessResponse<CurationPostDetailResult>> {
    const result = await curationPostService.getCurationPostDetail(
      parsePostId(postId),
      request.user?.uid,
    );

    return success(
      CURATION_POST_CODES.GET_CURATION_POST_DETAIL_SUCCESS,
      CURATION_POST_MESSAGES.GET_CURATION_POST_DETAIL_SUCCESS,
      result,
    );
  }

  @Post("/")
  @Security("bearer")
  @SuccessResponse(201, "Created")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(403, "Forbidden")
  @Response(404, "Not Found")
  public async createCurationPost(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateCurationPostRequest,
  ): Promise<ApiSuccessResponse<CreateCurationPostResult>> {
    requireAdmin(request);
    const result = await curationPostService.createPost(body);

    this.setStatus(201);
    return success(
      CURATION_POST_CODES.CREATE_CURATION_POST_SUCCESS,
      CURATION_POST_MESSAGES.CREATE_CURATION_POST_SUCCESS,
      result,
    );
  }

  @Patch("{postId}")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(403, "Forbidden")
  @Response(404, "Not Found")
  public async updateCurationPost(
    @Request() request: AuthenticatedRequest,
    @Path() postId: string,
    @Body() body: UpdateCurationPostRequest,
  ): Promise<ApiSuccessResponse<UpdateCurationPostResult>> {
    requireAdmin(request);
    const result = await curationPostService.updatePost(
      parsePostId(postId),
      body,
    );

    return success(
      CURATION_POST_CODES.UPDATE_CURATION_POST_SUCCESS,
      CURATION_POST_MESSAGES.UPDATE_CURATION_POST_SUCCESS,
      result,
    );
  }

  @Delete("{postId}")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(403, "Forbidden")
  @Response(404, "Not Found")
  public async deleteCurationPost(
    @Request() request: AuthenticatedRequest,
    @Path() postId: string,
  ): Promise<ApiSuccessResponse<null>> {
    requireAdmin(request);
    const result = await curationPostService.deletePost(parsePostId(postId));

    return success(
      CURATION_POST_CODES.DELETE_CURATION_POST_SUCCESS,
      CURATION_POST_MESSAGES.DELETE_CURATION_POST_SUCCESS,
      result,
    );
  }

  @Post("{postId}/likes")
  @Security("bearer")
  @SuccessResponse(201, "Created")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  @Response(409, "Conflict")
  public async createCurationPostLike(
    @Request() request: AuthenticatedRequest,
    @Path() postId: string,
  ): Promise<ApiSuccessResponse<CurationPostLikeResult>> {
    const result = await curationPostService.createLike(
      parsePostId(postId),
      getRequiredUid(request),
    );

    this.setStatus(201);
    return success(
      CURATION_POST_CODES.CREATE_CURATION_POST_LIKE_SUCCESS,
      CURATION_POST_MESSAGES.CREATE_CURATION_POST_LIKE_SUCCESS,
      result,
    );
  }

  @Delete("{postId}/likes")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  public async deleteCurationPostLike(
    @Request() request: AuthenticatedRequest,
    @Path() postId: string,
  ): Promise<ApiSuccessResponse<CurationPostLikeResult>> {
    const result = await curationPostService.deleteLike(
      parsePostId(postId),
      getRequiredUid(request),
    );

    return success(
      CURATION_POST_CODES.DELETE_CURATION_POST_LIKE_SUCCESS,
      CURATION_POST_MESSAGES.DELETE_CURATION_POST_LIKE_SUCCESS,
      result,
    );
  }

  @Post("{postId}/bookmarks")
  @Security("bearer")
  @SuccessResponse(201, "Created")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  @Response(409, "Conflict")
  public async createCurationPostBookmark(
    @Request() request: AuthenticatedRequest,
    @Path() postId: string,
  ): Promise<ApiSuccessResponse<CurationPostBookmarkResult>> {
    const result = await curationPostService.createBookmark(
      parsePostId(postId),
      getRequiredUid(request),
    );

    this.setStatus(201);
    return success(
      CURATION_POST_CODES.CREATE_CURATION_POST_BOOKMARK_SUCCESS,
      CURATION_POST_MESSAGES.CREATE_CURATION_POST_BOOKMARK_SUCCESS,
      result,
    );
  }

  @Delete("{postId}/bookmarks")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  public async deleteCurationPostBookmark(
    @Request() request: AuthenticatedRequest,
    @Path() postId: string,
  ): Promise<ApiSuccessResponse<CurationPostBookmarkResult>> {
    const result = await curationPostService.deleteBookmark(
      parsePostId(postId),
      getRequiredUid(request),
    );

    return success(
      CURATION_POST_CODES.DELETE_CURATION_POST_BOOKMARK_SUCCESS,
      CURATION_POST_MESSAGES.DELETE_CURATION_POST_BOOKMARK_SUCCESS,
      result,
    );
  }
}

@Route("users/me/bookmarks")
@Tags("Curation Posts")
export class MyCurationBookmarkController extends Controller {
  @Get("/")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  public async getMyBookmarks(
    @Request() request: AuthenticatedRequest,
    @Query() page = 1,
    @Query() size = 10,
  ): Promise<ApiSuccessResponse<MyBookmarkListResult>> {
    validatePageQuery(page, size);

    const result = await curationPostService.getMyBookmarks(
      getRequiredUid(request),
      page,
      size,
    );

    return success(
      CURATION_POST_CODES.GET_MY_BOOKMARKS_SUCCESS,
      CURATION_POST_MESSAGES.GET_MY_BOOKMARKS_SUCCESS,
      result,
    );
  }
}
