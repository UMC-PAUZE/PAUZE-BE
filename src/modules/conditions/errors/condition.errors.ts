import { AppError } from "../../../common/errors/app.error.js";

export class ConditionAlreadyExistsError extends AppError {
  constructor() {
    super({
      code: "CONDITION_ALREADY_EXISTS_409",
      message: "오늘의 컨디션은 이미 입력되었습니다.",
      statusCode: 409,
      result: [],
    });
  }
}

export class ConditionCreateFailedError extends AppError {
  constructor() {
    super({
      code: "CONDITION_CREATE_FAILED_500",
      message: "오늘의 컨디션 입력에 실패했습니다.",
      statusCode: 500,
      result: [],
    });
  }
}

export class ConditionDatabaseUnavailableError extends AppError {
  constructor() {
    super({
      code: "CONDITION_DATABASE_UNAVAILABLE_503",
      message: "컨디션 저장소에 연결할 수 없습니다.",
      statusCode: 503,
      result: [],
    });
  }
}

export class ConditionDatabaseTimeoutError extends AppError {
  constructor() {
    super({
      code: "CONDITION_DATABASE_TIMEOUT_504",
      message: "컨디션 저장 요청 시간이 초과되었습니다.",
      statusCode: 504,
      result: [],
    });
  }
}
