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
import { success } from "../../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../../common/responses/response.js";
import type {
  ConditionErrorResponseDto,
  CreateTodayConditionRequestDto,
  CreateTodayConditionResponseDto,
} from "../dto/condition.dto.js";
import { createTodayCondition } from "../service/condition.service.js";

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
  @Response<ConditionErrorResponseDto>(503, "Condition database unavailable")
  @Response<ConditionErrorResponseDto>(504, "Condition database timeout")
  public async createToday(
    @Request() request: ExpressRequest,
    @Body() body: CreateTodayConditionRequestDto,
  ): Promise<ApiSuccessResponse<CreateTodayConditionResponseDto>> {
    const result = await createTodayCondition(request.user!.uid, body);
    this.setStatus(201);
    return success(
      "CONDITION_CREATE_SUCCESS",
      "오늘의 컨디션 입력이 완료되었습니다.",
      result,
    );
  }
}
