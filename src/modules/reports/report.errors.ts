import { AppError } from "../../common/errors/app.error.js";

export class WeeklyReportNotFoundError extends AppError {
  constructor() {
    super({
      code: "WEEKLY_REPORT_NOT_FOUND",
      message: "조회 가능한 주간 리포트가 없습니다.",
      statusCode: 404,
      result: [],
    });
  }
}

export class MonthlyReportNotFoundError extends AppError {
  constructor() {
    super({
      code: "MONTHLY_REPORT_NOT_FOUND",
      message: "조회 가능한 월간 리포트가 없습니다.",
      statusCode: 404,
      result: [],
    });
  }
}

export class WeeklyReportFetchFailedError extends AppError {
  constructor() {
    super({
      code: "WEEKLY_REPORT_FETCH_FAILED",
      message: "주간 예민함 리포트 조회에 실패했습니다.",
      statusCode: 500,
      result: [],
    });
  }
}

export class MonthlyReportFetchFailedError extends AppError {
  constructor() {
    super({
      code: "MONTHLY_REPORT_FETCH_FAILED",
      message: "월간 예민함 리포트 조회에 실패했습니다.",
      statusCode: 500,
      result: [],
    });
  }
}
