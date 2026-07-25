import type { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  FormField,
  Get,
  Patch,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
  UploadedFile,
} from "tsoa";
import { AppError } from "../../../common/errors/app.error.js";
import { success } from "../../../common/responses/response.js";
import type { ApiSuccessResponse } from "../../../common/responses/response.js";
import type {
  UpdateUserSettingsRequestDto,
  UserMeResultDto,
  UserProfileResultDto,
  UserProfileUpdateResultDto,
  UserSettingsDto,
  WithdrawUserRequestDto,
} from "../dto/user.dto.js";
import { USER_CODES, USER_MESSAGES } from "../errors/user.errors.js";
import { userService } from "../service/user.service.js";

function getRequiredUid(request: ExpressRequest): string {
  const uid = request.user?.uid;
  if (!uid) {
    throw new AppError({
      code: USER_CODES.UNAUTHORIZED,
      message: USER_MESSAGES.UNAUTHORIZED,
      statusCode: 401,
    });
  }
  return uid;
}

@Route("users")
@Tags("Users")
export class UserController extends Controller {
  @Get("me")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  public async getMe(
    @Request() request: ExpressRequest
  ): Promise<ApiSuccessResponse<UserMeResultDto>> {
    const result = await userService.getMe(getRequiredUid(request));
    return success(USER_CODES.ME_SUCCESS, USER_MESSAGES.ME_SUCCESS, result);
  }

  @Get("me/profile")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  public async getProfile(
    @Request() request: ExpressRequest
  ): Promise<ApiSuccessResponse<UserProfileResultDto>> {
    const result = await userService.getProfile(getRequiredUid(request));
    return success(
      USER_CODES.PROFILE_SUCCESS,
      USER_MESSAGES.PROFILE_SUCCESS,
      result
    );
  }

  @Patch("me/profile")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(409, "Conflict")
  @Response(500, "Internal Server Error")
  public async updateProfile(
    @Request() request: ExpressRequest,
    @FormField() name?: string,
    @FormField() nickname?: string,
    @FormField() introduction?: string,
    @FormField() removeProfileImage?: string,
    @UploadedFile() profileImage?: Express.Multer.File
  ): Promise<ApiSuccessResponse<UserProfileUpdateResultDto>> {
    const result = await userService.updateProfile(
      getRequiredUid(request),
      {
        name,
        nickname,
        introduction,
        removeProfileImage,
      },
      profileImage
    );

    return success(
      USER_CODES.PROFILE_UPDATE_SUCCESS,
      USER_MESSAGES.PROFILE_UPDATE_SUCCESS,
      result
    );
  }

  @Patch("me/settings")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  public async updateSettings(
    @Request() request: ExpressRequest,
    @Body() body: UpdateUserSettingsRequestDto
  ): Promise<ApiSuccessResponse<UserSettingsDto>> {
    const result = await userService.updateSettings(
      getRequiredUid(request),
      body
    );
    return success(
      USER_CODES.SETTINGS_UPDATE_SUCCESS,
      USER_MESSAGES.SETTINGS_UPDATE_SUCCESS,
      result
    );
  }

  @Delete("me")
  @Security("bearer")
  @SuccessResponse(200, "OK")
  @Response(400, "Bad Request")
  @Response(401, "Unauthorized")
  @Response(404, "Not Found")
  public async withdraw(
    @Request() request: ExpressRequest,
    @Body() body: WithdrawUserRequestDto
  ): Promise<ApiSuccessResponse<null>> {
    await userService.withdraw(getRequiredUid(request), body.confirm);
    return success(
      USER_CODES.WITHDRAW_SUCCESS,
      USER_MESSAGES.WITHDRAW_SUCCESS,
      null
    );
  }
}
