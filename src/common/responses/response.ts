export interface ApiSuccessResponse<T> {
  isSuccess: true;
  code: string;
  message: string;
  result: T;
}

export interface ApiErrorResponse {
  isSuccess: false;
  code: string;
  message: string;
  result: unknown;
}

export const success = <T>(
  code: string,
  message: string,
  result: T
): ApiSuccessResponse<T> => ({
  isSuccess: true,
  code,
  message,
  result,
});
