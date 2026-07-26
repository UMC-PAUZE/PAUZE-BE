import type { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
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
import { AppError } from "../../../common/errors/app.error.js";
import type {
  AuthMeResultDto,
  AuthTokenResultDto,
  LocalLoginRequestDto,
  LocalSignupRequestDto,
  RefreshTokenRequestDto,
  RefreshTokenResultDto,
} from "../dto/auth.dto.js";
import { AUTH_CODES, AUTH_MESSAGES } from "../errors/auth.errors.js";
import { authService } from "../service/auth.service.js";

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  @Post("signup")
  @SuccessResponse(201, "Created")
  @Response(400, "Bad Request")
  @Response(409, "Conflict")
  @Response(500, "Internal Server Error")
  public async signup(
    @Body() body: LocalSignupRequestDto
  ): Promise<ApiSuccessResponse<AuthTokenResultDto>> {
    const result = await authService.signup(body);
    this.setStatus(201);
    return success(
      AUTH_CODES.LOCAL_SIGNUP_SUCCESS,
      AUTH_MESSAGES.LOCAL_SIGNUP_SUCCESS,
      result
    );
  }

  @Post("login")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  @Response(409, "Conflict")
  public async login(
    @Body() body: LocalLoginRequestDto
  ): Promise<ApiSuccessResponse<AuthTokenResultDto>> {
    const result = await authService.login(body);
    return success(AUTH_CODES.LOGIN_SUCCESS, AUTH_MESSAGES.LOGIN_SUCCESS, result);
  }

  @Post("refresh")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  public async refresh(
    @Body() body: RefreshTokenRequestDto
  ): Promise<ApiSuccessResponse<RefreshTokenResultDto>> {
    const result = await authService.refresh(body.refreshToken);
    return success(
      AUTH_CODES.REFRESH_SUCCESS,
      AUTH_MESSAGES.REFRESH_SUCCESS,
      result
    );
  }

  /**
   * 로그인 테스트용 — access token으로 현재 사용자 정보 조회
   */
  @Get("me")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  public async getMe(
    @Request() request: ExpressRequest
  ): Promise<ApiSuccessResponse<AuthMeResultDto>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: "AUTH_UNAUTHORIZED_401",
        message: "인증이 필요합니다.",
        statusCode: 401,
      });
    }

    const result = await authService.getMe(uid);
    return success(AUTH_CODES.ME_SUCCESS, AUTH_MESSAGES.ME_SUCCESS, result);
  }
}
