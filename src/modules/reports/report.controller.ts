import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Example,
  Get,
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
  MonthlyReportDto,
  ReportErrorResponseDto,
  WeeklyReportDto,
} from "./report.dto.js";
import { getMonthlyReport, getWeeklyReport } from "./report.service.js";

@Route("reports")
@Tags("Reports")
export class ReportController extends Controller {
  /** 현재 날짜가 포함된 월요일~일요일의 예민함 리포트를 조회합니다. */
  @Get("weekly")
  @Security("bearer")
  @Example<ApiSuccessResponse<WeeklyReportDto>>({
    isSuccess: true,
    code: "WEEKLY_REPORT_FETCH_SUCCESS",
    message: "주간 예민함 리포트 조회 성공",
    result: {
      averageScore: 55,
      hardestDay: "금요일",
      hardestScore: 82,
      pauzeCount: 0,
      scoreChange: -17,
      dailyScores: [
        { day: "월", score: 45 },
        { day: "금", score: 82 },
      ],
      topTriggers: [
        { rank: 1, trigger: "소음 노출", count: 5 },
        { rank: 2, trigger: "수면시간", count: 4 },
      ],
      insights: [
        "금요일에 예민함이 가장 높게 나타났어요.",
        "이번 주에는 소음 노출 트리거가 가장 자주 나타났어요.",
      ],
    },
  })
  @SuccessResponse(200, "Weekly report fetched")
  @Response<ReportErrorResponseDto>(401, "Unauthorized")
  @Response<ReportErrorResponseDto>(404, "Weekly report not found")
  @Response<ReportErrorResponseDto>(500, "Weekly report fetch failed")
  public async weekly(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<WeeklyReportDto>> {
    const uid = this.getAuthenticatedUid(request);
    const result = await getWeeklyReport(uid);
    return success(
      "WEEKLY_REPORT_FETCH_SUCCESS",
      "주간 예민함 리포트 조회 성공",
      result,
    );
  }

  /** 현재 날짜가 포함된 월의 예민함 리포트를 조회합니다. */
  @Get("monthly")
  @Security("bearer")
  @Example<ApiSuccessResponse<MonthlyReportDto>>({
    isSuccess: true,
    code: "MONTHLY_REPORT_FETCH_SUCCESS",
    message: "월간 예민함 리포트 조회 성공",
    result: {
      averageScore: 55,
      hardestWeek: "3주차",
      hardestScore: 71,
      pauzeCount: 0,
      scoreChange: -17,
      weeklyScores: [
        { week: "1주차", averageScore: 48 },
        { week: "2주차", averageScore: 63 },
        { week: "3주차", averageScore: 71 },
      ],
      topTriggers: [
        { rank: 1, trigger: "소음 노출", count: 18 },
        { rank: 2, trigger: "사회적 활동량", count: 14 },
      ],
      insights: [
        "이번 달에는 소음 노출 트리거가 가장 자주 나타났어요.",
        "3주차에 예민함이 가장 높게 나타났어요.",
      ],
    },
  })
  @SuccessResponse(200, "Monthly report fetched")
  @Response<ReportErrorResponseDto>(401, "Unauthorized")
  @Response<ReportErrorResponseDto>(404, "Monthly report not found")
  @Response<ReportErrorResponseDto>(500, "Monthly report fetch failed")
  public async monthly(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<MonthlyReportDto>> {
    const uid = this.getAuthenticatedUid(request);
    const result = await getMonthlyReport(uid);
    return success(
      "MONTHLY_REPORT_FETCH_SUCCESS",
      "월간 예민함 리포트 조회 성공",
      result,
    );
  }

  private getAuthenticatedUid(request: ExpressRequest): string {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "로그인이 필요합니다.",
        statusCode: 401,
        result: [],
      });
    }
    return uid;
  }
}
