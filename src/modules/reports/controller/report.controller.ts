import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Get,
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
  MonthlyReportDto,
  ReportErrorResponseDto,
  WeeklyReportDto,
} from "../dto/report.dto.js";
import { getMonthlyReport, getWeeklyReport } from "../service/report.service.js";

@Route("reports")
@Tags("Reports")
export class ReportController extends Controller {
  /** 현재 날짜가 포함된 월요일~일요일의 예민함 리포트를 조회합니다. */
  @Get("weekly")
  @Security("bearer")
  @SuccessResponse(200, "Weekly report fetched")
  @Response<ReportErrorResponseDto>(401, "Unauthorized")
  @Response<ReportErrorResponseDto>(404, "Weekly report not found")
  @Response<ReportErrorResponseDto>(500, "Weekly report fetch failed")
  public async weekly(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<WeeklyReportDto>> {
    const result = await getWeeklyReport(request.user!.uid);
    return success(
      "WEEKLY_REPORT_FETCH_SUCCESS",
      "주간 예민함 리포트 조회 성공",
      result,
    );
  }

  /** 현재 날짜가 포함된 월의 예민함 리포트를 조회합니다. */
  @Get("monthly")
  @Security("bearer")
  @SuccessResponse(200, "Monthly report fetched")
  @Response<ReportErrorResponseDto>(401, "Unauthorized")
  @Response<ReportErrorResponseDto>(404, "Monthly report not found")
  @Response<ReportErrorResponseDto>(500, "Monthly report fetch failed")
  public async monthly(
    @Request() request: ExpressRequest,
  ): Promise<ApiSuccessResponse<MonthlyReportDto>> {
    const result = await getMonthlyReport(request.user!.uid);
    return success(
      "MONTHLY_REPORT_FETCH_SUCCESS",
      "월간 예민함 리포트 조회 성공",
      result,
    );
  }
}
