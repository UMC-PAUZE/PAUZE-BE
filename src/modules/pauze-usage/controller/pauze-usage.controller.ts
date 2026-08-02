import type { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Example,
  Get,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import { AppError } from "../../../common/errors/app.error.js";
import { success } from "../../../common/responses/response.js";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../../../common/responses/response.js";
import type {
  PauzeUsageRecordRequest,
  PauzeUsageRecordResult,
  PauzeUsageStatistics,
} from "../dto/pauze-usage.dto.js";
import {
  PAUZE_USAGE_CODES,
  PAUZE_USAGE_MESSAGES,
} from "../errors/pauze-usage.errors.js";
import { pauzeUsageService } from "../service/pauze-usage.service.js";

@Route("pauze-usage")
@Tags("Pauze Usage")
export class PauzeUsageController extends Controller {
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * 로그인한 사용자의 누적 PAUZE 사용 횟수와 현재 연속 사용 일수를 조회합니다.
   * 연속 사용 일수는 한국 시간(Asia/Seoul)의 날짜를 기준으로 계산합니다.
   */
  @Get("statistics")
  @Security("bearer")
  @Example<ApiSuccessResponse<PauzeUsageStatistics>>({
    isSuccess: true,
    code: "COMMON_200",
    message: "사용 통계 조회에 성공했습니다.",
    result: {
      totalUsageCount: 10,
      currentStreakDays: 3,
    },
  })
  @SuccessResponse(200, "OK")
  @Response<ApiErrorResponse>(401, "Unauthorized", {
    isSuccess: false,
    code: PAUZE_USAGE_CODES.AUTH_UNAUTHORIZED,
    message: PAUZE_USAGE_MESSAGES.AUTH_UNAUTHORIZED,
    result: null,
  })
  @Response<ApiErrorResponse>(500, "Internal Server Error", {
    isSuccess: false,
    code: PAUZE_USAGE_CODES.STATISTICS_GET_FAILED,
    message: PAUZE_USAGE_MESSAGES.STATISTICS_GET_FAILED,
    result: null,
  })
  public async getStatistics(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<PauzeUsageStatistics>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: PAUZE_USAGE_CODES.AUTH_UNAUTHORIZED,
        message: PAUZE_USAGE_MESSAGES.AUTH_UNAUTHORIZED,
        statusCode: 401,
      });
    }

    const result = await pauzeUsageService.getStatistics(uid);
    return success(
      PAUZE_USAGE_CODES.STATISTICS_GET_SUCCESS,
      PAUZE_USAGE_MESSAGES.STATISTICS_GET_SUCCESS,
      result,
    );
  }

  @Post("/")
  @Security("bearer")
  @Example<ApiSuccessResponse<PauzeUsageRecordResult>>({
    isSuccess: true,
    code: "COMMON_200",
    message: "요청에 성공했습니다.",
    result: {
      usageId: "15",
      completionId: "550e8400-e29b-41d4-a716-446655440000",
      completedAt: "2026-08-02T03:30:00.000Z",
    },
  })
  @SuccessResponse(200, "OK")
  @Response<ApiErrorResponse>(400, "Invalid completionId", {
    isSuccess: false,
    code: PAUZE_USAGE_CODES.INVALID_COMPLETION_ID,
    message: PAUZE_USAGE_MESSAGES.INVALID_COMPLETION_ID,
    result: null,
  })
  @Response<ApiErrorResponse>(401, "Unauthorized", {
    isSuccess: false,
    code: PAUZE_USAGE_CODES.AUTH_UNAUTHORIZED,
    message: PAUZE_USAGE_MESSAGES.AUTH_UNAUTHORIZED,
    result: null,
  })
  @Response<ApiErrorResponse>(500, "Internal Server Error", {
    isSuccess: false,
    code: PAUZE_USAGE_CODES.SAVE_FAILED,
    message: PAUZE_USAGE_MESSAGES.SAVE_FAILED,
    result: null,
  })
  public async recordUsage(
    @Request() request: ExpressRequest,
    @Body() body: PauzeUsageRecordRequest,
  ): Promise<ApiSuccessResponse<PauzeUsageRecordResult>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: PAUZE_USAGE_CODES.AUTH_UNAUTHORIZED,
        message: PAUZE_USAGE_MESSAGES.AUTH_UNAUTHORIZED,
        statusCode: 401,
      });
    }

    if (!PauzeUsageController.UUID_PATTERN.test(body.completionId)) {
      throw new AppError({
        code: PAUZE_USAGE_CODES.INVALID_COMPLETION_ID,
        message: PAUZE_USAGE_MESSAGES.INVALID_COMPLETION_ID,
        statusCode: 400,
      });
    }

    const result = await pauzeUsageService.recordUsage(uid, body.completionId);
    return success(
      PAUZE_USAGE_CODES.RECORD_SUCCESS,
      PAUZE_USAGE_MESSAGES.RECORD_SUCCESS,
      result,
    );
  }
}
