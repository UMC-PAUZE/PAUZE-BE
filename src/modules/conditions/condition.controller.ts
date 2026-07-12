import type { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Example,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import { AppError } from "../../common/errors/app.error.js";
import { success } from "../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../common/responses/response.js";
import type {
  ConditionErrorResponseDto,
  CreateTodayConditionRequestDto,
  CreateTodayConditionResponseDto,
} from "./condition.dto.js";
import { createTodayCondition } from "./condition.service.js";

@Route("conditions")
@Tags("Conditions")
export class ConditionController extends Controller {
  @Post("today")
  @Security("bearer")
  @Example<ApiSuccessResponse<CreateTodayConditionResponseDto>>({
    isSuccess: true,
    code: "CONDITION_CREATE_SUCCESS",
    message: "오늘의 컨디션 입력이 완료되었습니다.",
    result: {
      conditionId: 1,
      sensitivityScore: 53,
      sensitivityLevel: "NORMAL",
      triggerCodes: [
        "SLEEP_DEPRIVATION",
        "VISUAL_STIMULATION",
        "LOW_ENERGY",
      ],
    },
  })
  @SuccessResponse(201, "Created")
  @Response<ConditionErrorResponseDto>(400, "Invalid condition input")
  @Response<ConditionErrorResponseDto>(401, "Unauthorized")
  @Response<ConditionErrorResponseDto>(409, "Condition already exists")
  @Response<ConditionErrorResponseDto>(500, "Condition creation failed")
  public async createToday(
    @Request() request: ExpressRequest,
    @Body() body: CreateTodayConditionRequestDto,
  ): Promise<ApiSuccessResponse<CreateTodayConditionResponseDto>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "인증이 필요합니다.",
        statusCode: 401,
        result: [],
      });
    }

    const result = await createTodayCondition(uid, body);
    this.setStatus(201);
    return success(
      "CONDITION_CREATE_SUCCESS",
      "오늘의 컨디션 입력이 완료되었습니다.",
      result,
    );
  }
}
