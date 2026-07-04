import { prisma } from "../../../db.config.js";
import { AppError } from "../../../common/errors/app.error.js";
import { SocialType, type Role } from "../../../generated/prisma/client.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../common/utils/jwt.util.js";
import {
  generateSalt,
  hashPassword,
  verifyPassword,
} from "../../../common/utils/password.util.js";
import {
  getRefreshTokenData,
  rotateRefreshToken,
  saveRefreshToken,
} from "../../../common/utils/redis.util.js";
import type {
  AuthMeResultDto,
  AuthTokenResultDto,
  AuthUserDto,
  LocalLoginRequestDto,
  LocalSignupRequestDto,
  RefreshTokenResultDto,
} from "../dto/auth.dto.js";
import {
  formatBirthDate,
  isValidBirth,
  isValidEmail,
  isValidPassword,
  parseBirthDate,
} from "../constants/auth.constants.js";
import { AUTH_CODES, AUTH_MESSAGES } from "../errors/auth.errors.js";

type EmailConflictResult =
  | { type: "NEW" }
  | { type: "DUPLICATE" }
  | { type: "LINK_REQUIRED"; email: string };

export class AuthService {
  private async checkEmailConflict(email: string): Promise<EmailConflictResult> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { oauths: true },
    });

    if (!user) {
      return { type: "NEW" };
    }

    const hasLocal = user.oauths.some(
      (oauth) => oauth.socialType === SocialType.LOCAL
    );
    const hasKakao = user.oauths.some(
      (oauth) => oauth.socialType === SocialType.KAKAO
    );

    if (hasLocal) {
      return { type: "DUPLICATE" };
    }

    if (hasKakao) {
      return { type: "LINK_REQUIRED", email };
    }

    return { type: "NEW" };
  }

  private toAuthUser(user: {
    uid: string;
    email: string;
    nickname: string;
    birth: Date;
  }): AuthUserDto {
    return {
      uid: user.uid,
      email: user.email,
      nickname: user.nickname,
      birth: formatBirthDate(user.birth),
    };
  }

  private async issueTokens(
    user: { uid: string; role: Role },
    providerId: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { uid: user.uid, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await saveRefreshToken({
      uid: user.uid,
      providerId,
      refreshToken,
    });

    return { accessToken, refreshToken };
  }

  private validateSignupRequest(body: LocalSignupRequestDto): void {
    if (
      !body.email ||
      !body.password ||
      !body.nickname ||
      !body.birth ||
      !Array.isArray(body.termAgreements) ||
      body.termAgreements.length === 0
    ) {
      throw new AppError({
        code: AUTH_CODES.SIGNUP_INVALID_REQUEST,
        message: AUTH_MESSAGES.SIGNUP_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    if (!isValidEmail(body.email) || !isValidPassword(body.password)) {
      throw new AppError({
        code: AUTH_CODES.SIGNUP_INVALID_REQUEST,
        message: AUTH_MESSAGES.SIGNUP_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    if (!body.nickname.trim() || !isValidBirth(body.birth)) {
      throw new AppError({
        code: AUTH_CODES.SIGNUP_INVALID_REQUEST,
        message: AUTH_MESSAGES.SIGNUP_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    for (const agreement of body.termAgreements) {
      if (!agreement.agreed) {
        throw new AppError({
          code: AUTH_CODES.SIGNUP_INVALID_REQUEST,
          message: AUTH_MESSAGES.SIGNUP_INVALID_REQUEST,
          statusCode: 400,
        });
      }
    }
  }

  private async validateTermAgreements(
    termAgreements: LocalSignupRequestDto["termAgreements"]
  ): Promise<void> {
    const termIds = termAgreements.map((agreement) => BigInt(agreement.termId));
    const terms = await prisma.term.findMany({
      where: { termId: { in: termIds } },
    });

    if (terms.length !== termAgreements.length) {
      throw new AppError({
        code: AUTH_CODES.SIGNUP_INVALID_REQUEST,
        message: AUTH_MESSAGES.SIGNUP_INVALID_REQUEST,
        statusCode: 400,
      });
    }
  }

  private throwLinkAccountRequired(email: string): never {
    throw new AppError({
      code: AUTH_CODES.LINK_ACCOUNT_REQUIRED,
      message: AUTH_MESSAGES.LINK_ACCOUNT_REQUIRED,
      statusCode: 409,
      result: {
        existingSocialType: "KAKAO",
        email,
      },
    });
  }

  async signup(body: LocalSignupRequestDto): Promise<AuthTokenResultDto> {
    this.validateSignupRequest(body);
    await this.validateTermAgreements(body.termAgreements);

    const conflict = await this.checkEmailConflict(body.email);
    if (conflict.type === "DUPLICATE") {
      throw new AppError({
        code: AUTH_CODES.EMAIL_DUPLICATE,
        message: AUTH_MESSAGES.EMAIL_DUPLICATE,
        statusCode: 409,
      });
    }
    if (conflict.type === "LINK_REQUIRED") {
      this.throwLinkAccountRequired(conflict.email);
    }

    const salt = generateSalt();
    const hashedPassword = hashPassword(salt, body.password);

    try {
      const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: body.email,
            nickname: body.nickname.trim(),
            birth: parseBirthDate(body.birth),
          },
        });

        await tx.oauth.create({
          data: {
            uid: createdUser.uid,
            socialType: SocialType.LOCAL,
            providerId: salt,
            password: hashedPassword,
            loginEmail: body.email,
          },
        });

        await tx.userTerm.createMany({
          data: body.termAgreements.map((agreement) => ({
            uid: createdUser.uid,
            termId: BigInt(agreement.termId),
            termActive: agreement.agreed,
          })),
        });

        return createdUser;
      });

      const tokens = await this.issueTokens(user, salt);

      return {
        ...tokens,
        user: this.toAuthUser(user),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError({
        code: AUTH_CODES.SIGNUP_FAILED,
        message: AUTH_MESSAGES.SIGNUP_FAILED,
        statusCode: 500,
      });
    }
  }

  async login(body: LocalLoginRequestDto): Promise<AuthTokenResultDto> {
    if (!body.email || !body.password || !isValidEmail(body.email)) {
      throw new AppError({
        code: AUTH_CODES.LOGIN_FAILED,
        message: AUTH_MESSAGES.LOGIN_FAILED,
        statusCode: 401,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { oauths: true },
    });

    if (!user) {
      throw new AppError({
        code: AUTH_CODES.LOGIN_FAILED,
        message: AUTH_MESSAGES.LOGIN_FAILED,
        statusCode: 401,
      });
    }

    const localOauth = user.oauths.find(
      (oauth) => oauth.socialType === SocialType.LOCAL
    );
    const hasKakao = user.oauths.some(
      (oauth) => oauth.socialType === SocialType.KAKAO
    );

    if (!localOauth) {
      if (hasKakao) {
        this.throwLinkAccountRequired(user.email);
      }

      throw new AppError({
        code: AUTH_CODES.LOGIN_FAILED,
        message: AUTH_MESSAGES.LOGIN_FAILED,
        statusCode: 401,
      });
    }

    if (
      !localOauth.password ||
      !verifyPassword(localOauth.providerId, body.password, localOauth.password)
    ) {
      throw new AppError({
        code: AUTH_CODES.LOGIN_FAILED,
        message: AUTH_MESSAGES.LOGIN_FAILED,
        statusCode: 401,
      });
    }

    const tokens = await this.issueTokens(user, localOauth.providerId);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResultDto> {
    if (!refreshToken) {
      throw new AppError({
        code: AUTH_CODES.REFRESH_INVALID,
        message: AUTH_MESSAGES.REFRESH_INVALID,
        statusCode: 401,
      });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError({
        code: AUTH_CODES.REFRESH_INVALID,
        message: AUTH_MESSAGES.REFRESH_INVALID,
        statusCode: 401,
      });
    }

    const stored = await getRefreshTokenData(refreshToken);
    if (!stored || stored.uid !== payload.uid || stored.refreshToken !== refreshToken) {
      throw new AppError({
        code: AUTH_CODES.REFRESH_INVALID,
        message: AUTH_MESSAGES.REFRESH_INVALID,
        statusCode: 401,
      });
    }

    const user = await prisma.user.findUnique({
      where: { uid: payload.uid },
    });

    if (!user) {
      throw new AppError({
        code: AUTH_CODES.REFRESH_INVALID,
        message: AUTH_MESSAGES.REFRESH_INVALID,
        statusCode: 401,
      });
    }

    const newAccessToken = signAccessToken({ uid: user.uid, role: user.role });
    const newRefreshToken = signRefreshToken({ uid: user.uid, role: user.role });

    await rotateRefreshToken(refreshToken, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getMe(uid: string): Promise<AuthMeResultDto> {
    const user = await prisma.user.findUnique({
      where: { uid },
      include: { oauths: true },
    });

    if (!user) {
      throw new AppError({
        code: AUTH_CODES.ME_NOT_FOUND,
        message: AUTH_MESSAGES.ME_NOT_FOUND,
        statusCode: 404,
      });
    }

    return {
      uid: user.uid,
      email: user.email,
      nickname: user.nickname,
      birth: formatBirthDate(user.birth),
      role: user.role,
      socialTypes: user.oauths.map((oauth) => oauth.socialType),
    };
  }
}

export const authService = new AuthService();
