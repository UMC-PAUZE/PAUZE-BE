import { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../common/errors/app.error.js";
import { prisma } from "../../../db.config.js";
import { deleteRefreshTokenByUid } from "../../../common/utils/redis.util.js";
import {
  buildProfileImageKey,
  deleteObject,
  uploadObject,
} from "../../../common/utils/s3.util.js";
import {
  hasUploadedProfileImage,
  isAllowedProfileImage,
  isValidIntroduction,
  isValidProfileName,
  isValidProfileNickname,
  normalizeOptionalFormString,
  parseBooleanFormField,
} from "../constants/user.constants.js";
import type {
  UpdateUserSettingsRequestDto,
  UserMeResultDto,
  UserProfileResultDto,
  UserProfileUpdateResultDto,
  UserSettingsDto,
} from "../dto/user.dto.js";
import { USER_CODES, USER_MESSAGES } from "../errors/user.errors.js";

type UserWithOauths = Prisma.UserGetPayload<{
  include: { oauths: { select: { socialType: true } } };
}>;

function formatJoinedAt(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toSettings(user: {
  reminderAlarmActive: boolean;
  sensitiveAlarmActive: boolean;
  breathGuideActive: boolean;
  stabilitySoundActive: boolean;
  offlineContentActive: boolean;
}): UserSettingsDto {
  return {
    notifications: {
      reminderAlarmActive: user.reminderAlarmActive,
      sensitiveAlarmActive: user.sensitiveAlarmActive,
    },
    stabilityContent: {
      breathingGuideEnabled: user.breathGuideActive,
      stabilitySoundEnabled: user.stabilitySoundActive,
      offlineContentEnabled: user.offlineContentActive,
    },
  };
}

function isUniqueConstraintError(
  error: unknown,
  field: string
): error is Prisma.PrismaClientKnownRequestError {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const meta = error.meta as
    | { target?: string | string[]; constraint?: string }
    | undefined;
  const target = meta?.target;

  if (Array.isArray(target)) {
    return target.includes(field);
  }
  if (typeof target === "string") {
    return target.includes(field);
  }

  // Driver adapters may omit target; fall back to constraint name / message.
  const constraint = meta?.constraint;
  if (typeof constraint === "string") {
    return constraint.includes(field);
  }
  if (error.message.includes(field)) {
    return true;
  }

  // No usable field metadata — still treat P2002 as the requested conflict.
  return true;
}

export class UserService {
  private async findUserOrThrow(uid: string): Promise<UserWithOauths> {
    const user = await prisma.user.findUnique({
      where: { uid },
      include: {
        oauths: {
          select: { socialType: true },
        },
      },
    });

    if (!user) {
      throw new AppError({
        code: USER_CODES.NOT_FOUND,
        message: USER_MESSAGES.NOT_FOUND,
        statusCode: 404,
      });
    }

    return user;
  }

  async getMe(uid: string): Promise<UserMeResultDto> {
    const user = await this.findUserOrThrow(uid);

    return {
      uid: user.uid,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      socialTypes: user.oauths.map((oauth) => oauth.socialType),
      settings: toSettings(user),
    };
  }

  async getProfile(uid: string): Promise<UserProfileResultDto> {
    const user = await this.findUserOrThrow(uid);

    return {
      uid: user.uid,
      name: user.name,
      nickname: user.nickname,
      introduction: user.introduction,
      profileImageUrl: user.profileImageUrl,
      email: user.email,
      socialTypes: user.oauths.map((oauth) => oauth.socialType),
      joinedAt: formatJoinedAt(user.createdAt),
      stats: {
        totalMeasurements: null,
        consecutiveDays: null,
        averageSensitivity: null,
      },
    };
  }

  async updateProfile(
    uid: string,
    fields: {
      name?: string;
      nickname?: string;
      introduction?: string | null;
      removeProfileImage?: string | boolean;
    },
    profileImage?: Express.Multer.File
  ): Promise<UserProfileUpdateResultDto> {
    const nameInput = normalizeOptionalFormString(fields.name);
    const nicknameInput = normalizeOptionalFormString(fields.nickname);
    const hasIntroduction = fields.introduction !== undefined;
    const uploadedImage = hasUploadedProfileImage(profileImage)
      ? profileImage
      : undefined;

    const removeRaw =
      fields.removeProfileImage === ""
        ? undefined
        : fields.removeProfileImage;
    const removeProfileImage = parseBooleanFormField(removeRaw);
    const hasRemoveFlag = removeRaw !== undefined;

    if (
      nameInput === undefined &&
      nicknameInput === undefined &&
      !hasIntroduction &&
      !hasRemoveFlag &&
      uploadedImage === undefined
    ) {
      throw new AppError({
        code: USER_CODES.PROFILE_INVALID,
        message: USER_MESSAGES.PROFILE_INVALID,
        statusCode: 400,
      });
    }

    if (nameInput !== undefined && !isValidProfileName(nameInput)) {
      throw new AppError({
        code: USER_CODES.PROFILE_INVALID,
        message: USER_MESSAGES.PROFILE_INVALID,
        statusCode: 400,
      });
    }

    if (
      nicknameInput !== undefined &&
      !isValidProfileNickname(nicknameInput)
    ) {
      throw new AppError({
        code: USER_CODES.PROFILE_INVALID,
        message: USER_MESSAGES.PROFILE_INVALID,
        statusCode: 400,
      });
    }

    if (hasIntroduction && !isValidIntroduction(fields.introduction)) {
      throw new AppError({
        code: USER_CODES.PROFILE_INVALID,
        message: USER_MESSAGES.PROFILE_INVALID,
        statusCode: 400,
      });
    }

    if (hasRemoveFlag && removeProfileImage === undefined) {
      throw new AppError({
        code: USER_CODES.PROFILE_INVALID,
        message: USER_MESSAGES.PROFILE_INVALID,
        statusCode: 400,
      });
    }

    if (uploadedImage && !isAllowedProfileImage(uploadedImage)) {
      throw new AppError({
        code: USER_CODES.PROFILE_INVALID,
        message: USER_MESSAGES.PROFILE_INVALID,
        statusCode: 400,
      });
    }

    const user = await this.findUserOrThrow(uid);
    const name = nameInput !== undefined ? nameInput.trim() : user.name;
    const nickname =
      nicknameInput !== undefined ? nicknameInput.trim() : user.nickname;
    const introduction = !hasIntroduction
      ? user.introduction
      : fields.introduction === null || fields.introduction === ""
        ? null
        : fields.introduction;

    if (nickname !== user.nickname) {
      const existing = await prisma.user.findUnique({
        where: { nickname },
        select: { uid: true },
      });
      if (existing && existing.uid !== uid) {
        throw new AppError({
          code: USER_CODES.NICKNAME_DUPLICATE,
          message: USER_MESSAGES.NICKNAME_DUPLICATE,
          statusCode: 409,
        });
      }
    }

    let uploadedKey: string | null = null;
    const previousKey = user.profileS3Key;
    const data: Prisma.UserUpdateInput = {};

    if (nameInput !== undefined) {
      data.name = name;
    }
    if (nicknameInput !== undefined) {
      data.nickname = nickname;
    }
    if (hasIntroduction) {
      data.introduction = introduction;
    }

    try {
      if (uploadedImage) {
        const key = buildProfileImageKey(uid, uploadedImage.originalname);
        const uploaded = await uploadObject({
          key,
          body: uploadedImage.buffer,
          filename: uploadedImage.originalname,
          contentType: uploadedImage.mimetype,
        });
        uploadedKey = uploaded.key;
        data.profileImageUrl = uploaded.url;
        data.profileS3Key = uploaded.key;
      } else if (removeProfileImage === true) {
        data.profileImageUrl = null;
        data.profileS3Key = null;
      }

      if (Object.keys(data).length === 0) {
        return {
          uid: user.uid,
          name: user.name,
          nickname: user.nickname,
          introduction: user.introduction,
          profileImageUrl: user.profileImageUrl,
        };
      }

      const updated = await prisma.user.update({
        where: { uid },
        data,
      });

      if (previousKey && previousKey !== updated.profileS3Key) {
        try {
          await deleteObject(previousKey);
        } catch {
          // best-effort cleanup
        }
      }

      return {
        uid: updated.uid,
        name: updated.name,
        nickname: updated.nickname,
        introduction: updated.introduction,
        profileImageUrl: updated.profileImageUrl,
      };
    } catch (error) {
      if (uploadedKey) {
        try {
          await deleteObject(uploadedKey);
        } catch {
          // best-effort rollback
        }
      }

      if (error instanceof AppError) {
        throw error;
      }

      if (isUniqueConstraintError(error, "nickname")) {
        throw new AppError({
          code: USER_CODES.NICKNAME_DUPLICATE,
          message: USER_MESSAGES.NICKNAME_DUPLICATE,
          statusCode: 409,
        });
      }

      throw new AppError({
        code: USER_CODES.PROFILE_UPDATE_FAILED,
        message: USER_MESSAGES.PROFILE_UPDATE_FAILED,
        statusCode: 500,
      });
    }
  }

  async updateSettings(
    uid: string,
    body: UpdateUserSettingsRequestDto
  ): Promise<UserSettingsDto> {
    const hasNotifications = body.notifications != null;
    const hasStability = body.stabilityContent != null;
    const hasPushToken = body.pushToken !== undefined;

    if (!hasNotifications && !hasStability && !hasPushToken) {
      throw new AppError({
        code: USER_CODES.SETTINGS_INVALID,
        message: USER_MESSAGES.SETTINGS_INVALID,
        statusCode: 400,
      });
    }

    await this.findUserOrThrow(uid);

    const data: Prisma.UserUpdateInput = {};

    if (body.notifications) {
      if (body.notifications.reminderAlarmActive !== undefined) {
        data.reminderAlarmActive = body.notifications.reminderAlarmActive;
      }
      if (body.notifications.sensitiveAlarmActive !== undefined) {
        data.sensitiveAlarmActive = body.notifications.sensitiveAlarmActive;
      }
    }

    if (body.stabilityContent) {
      if (body.stabilityContent.breathingGuideEnabled !== undefined) {
        data.breathGuideActive = body.stabilityContent.breathingGuideEnabled;
      }
      if (body.stabilityContent.stabilitySoundEnabled !== undefined) {
        data.stabilitySoundActive = body.stabilityContent.stabilitySoundEnabled;
      }
      if (body.stabilityContent.offlineContentEnabled !== undefined) {
        data.offlineContentActive = body.stabilityContent.offlineContentEnabled;
      }
    }

    if (hasPushToken) {
      data.pushToken = body.pushToken ?? null;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError({
        code: USER_CODES.SETTINGS_INVALID,
        message: USER_MESSAGES.SETTINGS_INVALID,
        statusCode: 400,
      });
    }

    const updated = await prisma.user.update({
      where: { uid },
      data,
    });

    return toSettings(updated);
  }

  async withdraw(uid: string, confirm: boolean): Promise<void> {
    if (confirm !== true) {
      throw new AppError({
        code: USER_CODES.WITHDRAW_INVALID,
        message: USER_MESSAGES.WITHDRAW_INVALID,
        statusCode: 400,
      });
    }

    const user = await this.findUserOrThrow(uid);
    const profileS3Key = user.profileS3Key;

    await deleteRefreshTokenByUid(uid);
    await prisma.user.delete({ where: { uid } });

    if (profileS3Key) {
      try {
        await deleteObject(profileS3Key);
      } catch {
        // best-effort cleanup after account deletion
      }
    }
  }
}

export const userService = new UserService();
