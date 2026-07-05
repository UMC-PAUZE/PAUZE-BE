import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Get,
  Query,
  Request,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { AppError } from "../../../common/errors/app.error.js";
import { success } from "../../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../../common/responses/response.js";
import type { CurationPostListResult } from "../dto/curation-post.dto.js";
import {
  CURATION_POST_CODES,
  CURATION_POST_MESSAGES,
} from "../errors/curation-post.errors.js";
import { curationPostService } from "../service/curation-post.service.js";

@Route("curation-posts")
@Tags("Curation Posts")
export class CurationPostController extends Controller {
  @Get("/")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  public async getCurationPosts(
    @Request() request: ExpressRequest,
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

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1) {
      throw new AppError({
        code: "BAD_REQUEST_400",
        message: "잘못된 요청 파라미터 형식입니다.",
        statusCode: 400,
      });
    }

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
}
