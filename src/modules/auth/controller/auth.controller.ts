import {
  Body,
  Controller,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { success } from "../../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../../common/responses/response.js";
import type {
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
}
