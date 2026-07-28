import type { Request as ExpressRequest } from "express";
import {
  Controller,
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
import type { PauzeUsageRecordResult } from "../dto/pauze-usage.dto.js";
import {
  PAUZE_USAGE_CODES,
  PAUZE_USAGE_MESSAGES,
} from "../errors/pauze-usage.errors.js";
import { pauzeUsageService } from "../service/pauze-usage.service.js";

@Route("pauze-usage")
@Tags("Pauze Usage")
export class PauzeUsageController extends Controller {
  @Post("/")
  @Security("bearer")
  @SuccessResponse(200, "OK")
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
  ): Promise<ApiSuccessResponse<PauzeUsageRecordResult>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: PAUZE_USAGE_CODES.AUTH_UNAUTHORIZED,
        message: PAUZE_USAGE_MESSAGES.AUTH_UNAUTHORIZED,
        statusCode: 401,
      });
    }

    const result = await pauzeUsageService.recordUsage(uid);
    return success(
      PAUZE_USAGE_CODES.RECORD_SUCCESS,
      PAUZE_USAGE_MESSAGES.RECORD_SUCCESS,
      result,
    );
  }
}
