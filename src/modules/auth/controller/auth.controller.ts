import type { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
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
  EmailAvailabilityResultDto,
  EmailCodeRequestDto,
  EmailCodeSentResultDto,
  EmailVerifiedResultDto,
  EmailVerifyRequestDto,
  KakaoConfirmRequestDto,
  KakaoLoginRequestDto,
  KakaoSignupRequiredResultDto,
  KakaoSignupRequestDto,
  LinkAccountRequestDto,
  LinkEmailCodeRequestDto,
  LocalLoginRequestDto,
  LocalSignupRequestDto,
  LogoutRequestDto,
  NicknameAvailabilityResultDto,
  RefreshTokenRequestDto,
  RefreshTokenResultDto,
} from "../dto/auth.dto.js";
import { AUTH_CODES, AUTH_MESSAGES } from "../errors/auth.errors.js";
import { authService } from "../service/auth.service.js";

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  @Get("email/availability")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(429, "Too Many Requests")
  public async checkEmailAvailability(
    @Query() email: string
  ): Promise<ApiSuccessResponse<EmailAvailabilityResultDto>> {
    const result = await authService.checkEmailAvailability(email);
    return success(
      AUTH_CODES.EMAIL_AVAILABLE,
      AUTH_MESSAGES.EMAIL_AVAILABLE,
      result
    );
  }

  @Get("nickname/availability")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(429, "Too Many Requests")
  public async checkNicknameAvailability(
    @Query() nickname: string
  ): Promise<ApiSuccessResponse<NicknameAvailabilityResultDto>> {
    const result = await authService.checkNicknameAvailability(nickname);
    return success(
      AUTH_CODES.NICKNAME_AVAILABLE,
      AUTH_MESSAGES.NICKNAME_AVAILABLE,
      result
    );
  }

  @Post("email/code")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(409, "Conflict")
  @Response(429, "Too Many Requests")
  @Response(500, "Internal Server Error")
  public async sendSignupEmailCode(
    @Body() body: EmailCodeRequestDto
  ): Promise<ApiSuccessResponse<EmailCodeSentResultDto>> {
    const result = await authService.sendSignupEmailCode(body);
    return success(
      AUTH_CODES.EMAIL_CODE_SENT,
      AUTH_MESSAGES.EMAIL_CODE_SENT,
      result
    );
  }

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
  public async login(
    @Body() body: LocalLoginRequestDto
  ): Promise<ApiSuccessResponse<AuthTokenResultDto>> {
    const result = await authService.login(body);
    return success(AUTH_CODES.LOGIN_SUCCESS, AUTH_MESSAGES.LOGIN_SUCCESS, result);
  }

  @Post("email/verify")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  public async verifyEmail(
    @Body() body: EmailVerifyRequestDto
  ): Promise<ApiSuccessResponse<EmailVerifiedResultDto>> {
    const result = await authService.verifyEmail(body);

    if (result.nextStep === "ASK_LINK") {
      return success(
        AUTH_CODES.EMAIL_VERIFIED,
        AUTH_MESSAGES.EMAIL_VERIFIED_ASK_LINK,
        result
      );
    }

    return success(
      AUTH_CODES.EMAIL_VERIFIED,
      AUTH_MESSAGES.EMAIL_VERIFIED,
      result
    );
  }

  @Post("signup/kakao-confirm")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(409, "Conflict")
  public async kakaoConfirm(
    @Body() body: KakaoConfirmRequestDto
  ): Promise<ApiSuccessResponse<EmailCodeSentResultDto>> {
    const result = await authService.kakaoConfirm(body);
    return success(
      AUTH_CODES.EMAIL_CODE_SENT,
      AUTH_MESSAGES.EMAIL_CODE_SENT,
      result
    );
  }

  @Post("link/email-code")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(409, "Conflict")
  @Response(429, "Too Many Requests")
  public async sendLinkEmailCode(
    @Body() body: LinkEmailCodeRequestDto
  ): Promise<ApiSuccessResponse<EmailCodeSentResultDto>> {
    const result = await authService.sendLinkEmailCode(body);
    return success(
      AUTH_CODES.EMAIL_CODE_SENT,
      AUTH_MESSAGES.EMAIL_CODE_SENT,
      result
    );
  }

  @Post("link")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(409, "Conflict")
  @Response(500, "Internal Server Error")
  public async linkAccount(
    @Body() body: LinkAccountRequestDto
  ): Promise<ApiSuccessResponse<AuthTokenResultDto>> {
    const result = await authService.linkAccount(body);
    return success(AUTH_CODES.LINK_SUCCESS, AUTH_MESSAGES.LINK_SUCCESS, result);
  }

  @Post("kakao")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(409, "Conflict")
  @Response(500, "Internal Server Error")
  public async kakaoLogin(
    @Body() body: KakaoLoginRequestDto
  ): Promise<
    ApiSuccessResponse<AuthTokenResultDto | KakaoSignupRequiredResultDto>
  > {
    const result = await authService.kakaoLogin(body);

    if ("accessToken" in result) {
      return success(
        AUTH_CODES.KAKAO_LOGIN_SUCCESS,
        AUTH_MESSAGES.KAKAO_LOGIN_SUCCESS,
        result
      );
    }

    return success(
      AUTH_CODES.KAKAO_SIGNUP_REQUIRED,
      AUTH_MESSAGES.KAKAO_SIGNUP_REQUIRED,
      result
    );
  }

  @Post("kakao/signup")
  @SuccessResponse(201, "Created")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(409, "Conflict")
  public async kakaoSignup(
    @Body() body: KakaoSignupRequestDto
  ): Promise<ApiSuccessResponse<AuthTokenResultDto>> {
    const result = await authService.kakaoSignup(body);
    this.setStatus(201);
    return success(
      AUTH_CODES.KAKAO_SIGNUP_SUCCESS,
      AUTH_MESSAGES.KAKAO_SIGNUP_SUCCESS,
      result
    );
  }

  @Post("logout")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  public async logout(
    @Request() request: ExpressRequest,
    @Body() body: LogoutRequestDto = {}
  ): Promise<ApiSuccessResponse<null>> {
    const uid = request.user?.uid;
    if (!uid) {
      throw new AppError({
        code: AUTH_CODES.UNAUTHORIZED,
        message: AUTH_MESSAGES.UNAUTHORIZED,
        statusCode: 401,
      });
    }

    await authService.logout(uid, body ?? {});
    return success(AUTH_CODES.LOGOUT_SUCCESS, AUTH_MESSAGES.LOGOUT_SUCCESS, null);
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
        code: AUTH_CODES.UNAUTHORIZED,
        message: AUTH_MESSAGES.UNAUTHORIZED,
        statusCode: 401,
      });
    }

    const result = await authService.getMe(uid);
    return success(AUTH_CODES.ME_SUCCESS, AUTH_MESSAGES.ME_SUCCESS, result);
  }
}
