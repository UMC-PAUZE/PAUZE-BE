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
import { success } from "../../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../../common/responses/response.js";
import type {
  ConditionErrorResponseDto,
  CreateTodayConditionRequestDto,
  CreateTodayConditionResponseDto,
  GetTodayConditionResponseDto,
} from "../dto/condition.dto.js";
import {
  createTodayCondition,
  getTodayCondition,
} from "../service/condition.service.js";

@Route("conditions")
@Tags("Conditions")
export class ConditionController extends Controller {
  @Get("today")
  @Security("bearer")
  @Example<ApiSuccessResponse<GetTodayConditionResponseDto>>({
    isSuccess: true,
    code: "CONDITION_TODAY_FETCH_SUCCESS",
    message: "오늘의 컨디션 조회에 성공했습니다.",
    result: {
      conditionId: 1,
      conditionDate: "2026-08-10",
      sleepLevel: "FOUR_TO_SIX",
      noiseLevel: "NORMAL",
      visualLevel: "HIGH",
      socialLevel: "LITTLE",
      energyLevel: "LOW",
      sensitivityScore: 59,
      sensitivityLevel: "NORMAL",
      triggerCodes: [
        "SLEEP_DEPRIVATION",
        "VISUAL_OVERLOAD",
        "SOCIAL_FATIGUE",
        "ENERGY_DEPLETION",
      ],
    },
  })
  @SuccessResponse(200, "OK")
  @Response<ConditionErrorResponseDto>(401, "Unauthorized")
  @Response<ConditionErrorResponseDto>(404, "Condition not found")
  @Response<ConditionErrorResponseDto>(500, "Condition fetch failed")
  @Response<ConditionErrorResponseDto>(503, "Condition database unavailable")
  @Response<ConditionErrorResponseDto>(504, "Condition database timeout")
  public async getToday(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<GetTodayConditionResponseDto>> {
    const result = await getTodayCondition(request.user!.uid);
    return success(
      "CONDITION_TODAY_FETCH_SUCCESS",
      "오늘의 컨디션 조회에 성공했습니다.",
      result,
    );
  }

  @Post("today")
  @Security("bearer")
  @Example<ApiSuccessResponse<CreateTodayConditionResponseDto>>({
    isSuccess: true,
    code: "CONDITION_CREATE_SUCCESS",
    message: "오늘의 컨디션 입력이 완료되었습니다.",
    result: {
      conditionId: 1,
      sensitivityScore: 59,
      sensitivityLevel: "NORMAL",
      triggerCodes: [
        "SLEEP_DEPRIVATION",
        "VISUAL_OVERLOAD",
        "SOCIAL_FATIGUE",
        "ENERGY_DEPLETION",
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
