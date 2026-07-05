import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Get,
  Header,
  Query,
  Request,
  Route,
  Tags,
} from "tsoa";
import { AppError } from "../../common/errors/app.error.js";
import type {
  ApiResponse,
  CurationPostListResult,
} from "./curation-post.dto.js";
import { CurationPostService } from "./curation-post.service.js";

type AuthenticatedRequest = ExpressRequest & {
  user?: {
    uid?: string;
  };
};

@Route("v1/curation-posts")
@Tags("Curation Posts")
export class CurationPostController extends Controller {
  private readonly curationPostService = new CurationPostService();

  @Get("/")
  public async getCurationPosts(
    @Request() request: AuthenticatedRequest,
    @Header("Authorization") authorization?: string,
    @Query() categoryId?: number,
    @Query() keyword?: string,
    @Query() page = 1,
    @Query() size = 10,
  ): Promise<ApiResponse<CurationPostListResult>> {
    if (categoryId !== undefined && (!Number.isInteger(categoryId) || categoryId < 1)) {
      throw new AppError({
        errorCode: "BAD_REQUEST_400",
        message: "잘못된 요청 파라미터 형식입니다.",
        statusCode: 400,
      });
    }

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1) {
      throw new AppError({
        errorCode: "BAD_REQUEST_400",
        message: "잘못된 요청 파라미터 형식입니다.",
        statusCode: 400,
      });
    }

    return this.curationPostService.getCurationPosts({
      categoryId,
      keyword,
      page,
      size,
      userId: request.user?.uid,
    });
  }
}
