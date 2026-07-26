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
  deleteEmailCode,
  deleteEmailCodeAttempts,
  deleteEmailPending,
  deleteEmailVerified,
  deleteRefreshToken,
  deleteRefreshTokenByUid,
  EMAIL_CODE_EXPIRES_IN,
  EMAIL_CODE_MAX_ATTEMPTS,
  claimEmailCodeSendSlot,
  getEmailCode,
  getEmailPending,
  getRefreshTokenData,
  incrementEmailCodeAttempts,
  isEmailVerified,
  rotateRefreshToken,
  saveEmailCode,
  saveEmailPending,
  saveEmailVerified,
  saveRefreshToken,
  type LinkPendingPayload,
  type SignupPendingPayload,
} from "../../../common/utils/redis.util.js";
import { fetchKakaoUser } from "../../../common/utils/kakao.util.js";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "../../../common/utils/mail.util.js";
import type {
  AuthMeResultDto,
  AuthTokenResultDto,
  AuthUserDto,
  EmailCodeSentResultDto,
  EmailVerifiedAskLinkResultDto,
  EmailVerifyRequestDto,
  KakaoConfirmRequestDto,
  KakaoLoginRequestDto,
  KakaoSignupRequiredResultDto,
  KakaoSignupRequestDto,
  LinkAccountRequestDto,
  LocalLoginRequestDto,
  LocalSignupRequestDto,
  LogoutRequestDto,
  RefreshTokenResultDto,
} from "../dto/auth.dto.js";
import {
  formatBirthDate,
  isValidBirth,
  isValidEmail,
  isValidName,
  isValidNickname,
  isValidPassword,
  parseBirthDate,
} from "../constants/auth.constants.js";
import { AUTH_CODES, AUTH_MESSAGES } from "../errors/auth.errors.js";

type EmailConflictResult =
  | { type: "NEW" }
  | { type: "DUPLICATE" }
  | { type: "KAKAO_EXISTS"; email: string };

export class AuthService {
  private toAuthUser(user: {
    uid: string;
    email: string;
    name: string;
    nickname: string;
    birth: Date;
  }): AuthUserDto {
    return {
      uid: user.uid,
      email: user.email,
      name: user.name,
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

  private async checkEmailConflict(email: string): Promise<EmailConflictResult> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        oauths: {
          select: { socialType: true },
        },
      },
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
      return { type: "KAKAO_EXISTS", email };
    }

    return { type: "DUPLICATE" };
  }

  private validateSignupRequest(body: LocalSignupRequestDto): void {
    if (
      !body.email ||
      !body.password ||
      !body.name ||
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

    if (
      !isValidEmail(body.email) ||
      !isValidPassword(body.password) ||
      !isValidName(body.name) ||
      !isValidNickname(body.nickname) ||
      !isValidBirth(body.birth)
    ) {
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

  private async assertNicknameAvailable(nickname: string): Promise<void> {
    const existing = await prisma.user.findUnique({
      where: { nickname },
    });
    if (existing) {
      throw new AppError({
        code: AUTH_CODES.NICKNAME_DUPLICATE,
        message: AUTH_MESSAGES.NICKNAME_DUPLICATE,
        statusCode: 409,
      });
    }
  }

  private async requireKakaoUser(kakaoAccessToken: string) {
    if (!kakaoAccessToken?.trim()) {
      throw new AppError({
        code: AUTH_CODES.KAKAO_TOKEN_MISSING,
        message: AUTH_MESSAGES.KAKAO_TOKEN_MISSING,
        statusCode: 400,
      });
    }

    let kakaoUser;
    try {
      kakaoUser = await fetchKakaoUser(kakaoAccessToken.trim());
    } catch (error) {
      const isTimeout =
        (error instanceof Error && error.name === "AbortError") ||
        (typeof DOMException !== "undefined" &&
          error instanceof DOMException &&
          error.name === "AbortError");
      console.error("Kakao user fetch failed", {
        message: error instanceof Error ? error.message : "unknown",
        name: error instanceof Error ? error.name : undefined,
        statusCode: isTimeout ? 503 : 502,
      });
      throw new AppError({
        code: AUTH_CODES.KAKAO_LOGIN_FAILED,
        message: AUTH_MESSAGES.KAKAO_LOGIN_FAILED,
        statusCode: isTimeout ? 503 : 502,
      });
    }

    if (!kakaoUser) {
      throw new AppError({
        code: AUTH_CODES.KAKAO_TOKEN_INVALID,
        message: AUTH_MESSAGES.KAKAO_TOKEN_INVALID,
        statusCode: 401,
      });
    }

    return kakaoUser;
  }

  private async sendCodeAndStorePending(
    email: string,
    pending: SignupPendingPayload | LinkPendingPayload
  ): Promise<EmailCodeSentResultDto> {
    if (!(await claimEmailCodeSendSlot(email))) {
      throw new AppError({
        code: AUTH_CODES.EMAIL_CODE_TOO_SOON,
        message: AUTH_MESSAGES.EMAIL_CODE_TOO_SOON,
        statusCode: 429,
      });
    }

    const code = generateVerificationCode();
    await deleteEmailCodeAttempts(email);
    await saveEmailCode(email, code);
    await saveEmailPending(email, pending);
    try {
      await sendVerificationEmail(email, code);
    } catch (error) {
      await deleteEmailCode(email);
      await deleteEmailPending(email);
      throw error;
    }

    return {
      email,
      expiresIn: EMAIL_CODE_EXPIRES_IN,
      nextStep: "VERIFY_EMAIL",
    };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) {
      return "***";
    }
    return `${local.slice(0, 1)}***@${domain}`;
  }

  private isUniqueConstraintError(
    error: unknown,
    field?: string
  ): boolean {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "P2002"
    ) {
      return false;
    }
    if (!field) {
      return true;
    }
    const meta = (error as { meta?: { target?: string | string[] } }).meta;
    const target = meta?.target;
    if (Array.isArray(target)) {
      return target.includes(field);
    }
    if (typeof target === "string") {
      return target.includes(field);
    }
    return false;
  }

  async signup(body: LocalSignupRequestDto): Promise<EmailCodeSentResultDto> {
    this.validateSignupRequest(body);
    await this.validateTermAgreements(body.termAgreements);

    const nickname = body.nickname.trim();
    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();

    await this.assertNicknameAvailable(nickname);

    const conflict = await this.checkEmailConflict(email);
    if (conflict.type === "DUPLICATE") {
      throw new AppError({
        code: AUTH_CODES.EMAIL_DUPLICATE,
        message: AUTH_MESSAGES.EMAIL_DUPLICATE,
        statusCode: 409,
      });
    }
    if (conflict.type === "KAKAO_EXISTS") {
      throw new AppError({
        code: AUTH_CODES.KAKAO_ACCOUNT_EXISTS,
        message: AUTH_MESSAGES.KAKAO_ACCOUNT_EXISTS,
        statusCode: 409,
        result: {
          existingSocialType: "KAKAO",
          email: conflict.email,
          nextStep: "KAKAO_CONFIRM",
        },
      });
    }

    try {
      const salt = generateSalt();
      const hashedPassword = hashPassword(salt, body.password);
      return await this.sendCodeAndStorePending(email, {
        purpose: "SIGNUP",
        email,
        salt,
        hashedPassword,
        name,
        nickname,
        birth: body.birth,
        termAgreements: body.termAgreements,
      });
    } catch (error) {
      console.error("Signup email code send failed", {
        code:
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof (error as { code: unknown }).code === "string"
            ? (error as { code: string }).code
            : undefined,
        message: error instanceof Error ? error.message : "unknown",
      });

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

    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
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
        throw new AppError({
          code: AUTH_CODES.LINK_ACCOUNT_REQUIRED,
          message: AUTH_MESSAGES.LINK_ACCOUNT_REQUIRED,
          statusCode: 409,
          result: {
            existingSocialType: "KAKAO",
            email: user.email,
          },
        });
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

  async verifyEmail(
    body: EmailVerifyRequestDto
  ): Promise<AuthTokenResultDto | EmailVerifiedAskLinkResultDto> {
    if (!body.email || !body.code || !isValidEmail(body.email)) {
      throw new AppError({
        code: AUTH_CODES.EMAIL_CODE_INVALID,
        message: AUTH_MESSAGES.EMAIL_CODE_INVALID,
        statusCode: 400,
      });
    }

    const email = body.email.trim().toLowerCase();
    const attempts = await incrementEmailCodeAttempts(email);
    if (attempts > EMAIL_CODE_MAX_ATTEMPTS) {
      await deleteEmailCode(email);
      await deleteEmailPending(email);
      await deleteEmailCodeAttempts(email);
      throw new AppError({
        code: AUTH_CODES.EMAIL_CODE_INVALID,
        message: AUTH_MESSAGES.EMAIL_CODE_INVALID,
        statusCode: 400,
      });
    }

    const storedCode = await getEmailCode(email);
    if (!storedCode || storedCode !== body.code.trim()) {
      throw new AppError({
        code: AUTH_CODES.EMAIL_CODE_INVALID,
        message: AUTH_MESSAGES.EMAIL_CODE_INVALID,
        statusCode: 400,
      });
    }

    const pending = await getEmailPending(email);
    if (!pending) {
      throw new AppError({
        code: AUTH_CODES.EMAIL_CODE_INVALID,
        message: AUTH_MESSAGES.EMAIL_CODE_INVALID,
        statusCode: 400,
      });
    }

    await deleteEmailCode(email);
    await deleteEmailCodeAttempts(email);

    if (pending.purpose === "LINK") {
      await saveEmailVerified(email);
      await deleteEmailPending(email);
      return {
        email,
        nextStep: "ASK_LINK",
      };
    }

    await this.assertNicknameAvailable(pending.nickname);

    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: pending.email,
            name: pending.name,
            nickname: pending.nickname,
            birth: parseBirthDate(pending.birth),
          },
        });

        await tx.oauth.create({
          data: {
            uid: createdUser.uid,
            socialType: SocialType.LOCAL,
            providerId: pending.salt,
            password: pending.hashedPassword,
            loginEmail: pending.email,
          },
        });

        await tx.userTerm.createMany({
          data: pending.termAgreements.map((agreement) => ({
            uid: createdUser.uid,
            termId: BigInt(agreement.termId),
            termActive: agreement.agreed,
          })),
        });

        return createdUser;
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error, "nickname")) {
        throw new AppError({
          code: AUTH_CODES.NICKNAME_DUPLICATE,
          message: AUTH_MESSAGES.NICKNAME_DUPLICATE,
          statusCode: 409,
        });
      }
      if (this.isUniqueConstraintError(error, "email")) {
        throw new AppError({
          code: AUTH_CODES.EMAIL_DUPLICATE,
          message: AUTH_MESSAGES.EMAIL_DUPLICATE,
          statusCode: 409,
        });
      }
      throw error;
    }

    await deleteEmailPending(email);
    const tokens = await this.issueTokens(user, pending.salt);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async kakaoConfirm(
    body: KakaoConfirmRequestDto
  ): Promise<EmailCodeSentResultDto> {
    if (!body.email || !isValidEmail(body.email)) {
      throw new AppError({
        code: AUTH_CODES.SIGNUP_INVALID_REQUEST,
        message: AUTH_MESSAGES.SIGNUP_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    const email = body.email.trim().toLowerCase();
    const kakaoUser = await this.requireKakaoUser(body.kakaoAccessToken);

    if (kakaoUser.email.toLowerCase() !== email) {
      throw new AppError({
        code: AUTH_CODES.KAKAO_ACCOUNT_MISMATCH,
        message: AUTH_MESSAGES.KAKAO_ACCOUNT_MISMATCH,
        statusCode: 409,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { oauths: true },
    });

    const kakaoOauth = user?.oauths.find(
      (oauth) => oauth.socialType === SocialType.KAKAO
    );

    if (!kakaoOauth || kakaoOauth.providerId !== kakaoUser.providerId) {
      throw new AppError({
        code: AUTH_CODES.KAKAO_ACCOUNT_MISMATCH,
        message: AUTH_MESSAGES.KAKAO_ACCOUNT_MISMATCH,
        statusCode: 409,
      });
    }

    return this.sendCodeAndStorePending(email, {
      purpose: "LINK",
      email,
      kakaoProviderId: kakaoUser.providerId,
    });
  }

  async linkAccount(body: LinkAccountRequestDto): Promise<AuthTokenResultDto> {
    if (body.agree === false) {
      throw new AppError({
        code: AUTH_CODES.LINK_REJECTED,
        message: AUTH_MESSAGES.LINK_REJECTED,
        statusCode: 400,
      });
    }

    if (body.agree !== true) {
      throw new AppError({
        code: AUTH_CODES.LINK_INVALID_REQUEST,
        message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    const kakaoUser = await this.requireKakaoUser(body.kakaoAccessToken);
    const kakaoEmail = kakaoUser.email.toLowerCase();

    // Reject email-only payloads (password required when linking email credentials).
    if ("email" in body && body.email && !body.password) {
      throw new AppError({
        code: AUTH_CODES.LINK_INVALID_REQUEST,
        message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    // KAKAO → LOCAL: existing KAKAO account receives LOCAL credentials
    if (body.email && body.password) {
      const email = body.email.trim().toLowerCase();

      if (!isValidEmail(email) || !isValidPassword(body.password)) {
        throw new AppError({
          code: AUTH_CODES.LINK_INVALID_REQUEST,
          message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
          statusCode: 400,
        });
      }

      if (!(await isEmailVerified(email))) {
        throw new AppError({
          code: AUTH_CODES.LINK_INVALID_REQUEST,
          message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
          statusCode: 400,
        });
      }

      if (kakaoEmail !== email) {
        throw new AppError({
          code: AUTH_CODES.KAKAO_ACCOUNT_MISMATCH,
          message: AUTH_MESSAGES.KAKAO_ACCOUNT_MISMATCH,
          statusCode: 409,
        });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { oauths: true },
      });

      if (!user) {
        throw new AppError({
          code: AUTH_CODES.LINK_INVALID_REQUEST,
          message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
          statusCode: 400,
        });
      }

      const hasLocal = user.oauths.some(
        (oauth) => oauth.socialType === SocialType.LOCAL
      );
      const kakaoOauth = user.oauths.find(
        (oauth) => oauth.socialType === SocialType.KAKAO
      );

      if (hasLocal || !kakaoOauth || kakaoOauth.providerId !== kakaoUser.providerId) {
        throw new AppError({
          code: AUTH_CODES.LINK_INVALID_REQUEST,
          message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
          statusCode: 400,
        });
      }

      const salt = generateSalt();
      const hashedPassword = hashPassword(salt, body.password);

      try {
        await prisma.oauth.create({
          data: {
            uid: user.uid,
            socialType: SocialType.LOCAL,
            providerId: salt,
            password: hashedPassword,
            loginEmail: email,
          },
        });
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new AppError({
            code: AUTH_CODES.LINK_INVALID_REQUEST,
            message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
            statusCode: 409,
          });
        }
        throw error;
      }

      await deleteEmailVerified(email);
      const tokens = await this.issueTokens(user, salt);

      return {
        ...tokens,
        user: this.toAuthUser(user),
      };
    }

    // LOCAL → KAKAO: link kakao onto existing local account
    const user = await prisma.user.findUnique({
      where: { email: kakaoEmail },
      include: { oauths: true },
    });

    if (!user) {
      throw new AppError({
        code: AUTH_CODES.LINK_INVALID_REQUEST,
        message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    const hasLocal = user.oauths.some(
      (oauth) => oauth.socialType === SocialType.LOCAL
    );
    const hasKakao = user.oauths.some(
      (oauth) => oauth.socialType === SocialType.KAKAO
    );

    if (!hasLocal || hasKakao) {
      throw new AppError({
        code: AUTH_CODES.LINK_INVALID_REQUEST,
        message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    const emailVerified = await isEmailVerified(kakaoEmail);
    if (!emailVerified) {
      const localOauth = user.oauths.find(
        (oauth) => oauth.socialType === SocialType.LOCAL
      );
      if (
        !body.password ||
        !localOauth?.password ||
        !verifyPassword(
          localOauth.providerId,
          body.password,
          localOauth.password
        )
      ) {
        throw new AppError({
          code: AUTH_CODES.LINK_INVALID_REQUEST,
          message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
          statusCode: 400,
        });
      }
    }

    try {
      await prisma.oauth.create({
        data: {
          uid: user.uid,
          socialType: SocialType.KAKAO,
          providerId: kakaoUser.providerId,
          password: null,
          loginEmail: kakaoEmail,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new AppError({
          code: AUTH_CODES.LINK_INVALID_REQUEST,
          message: AUTH_MESSAGES.LINK_INVALID_REQUEST,
          statusCode: 409,
        });
      }
      throw error;
    }

    if (emailVerified) {
      await deleteEmailVerified(kakaoEmail);
    }

    const tokens = await this.issueTokens(user, kakaoUser.providerId);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async kakaoLogin(
    body: KakaoLoginRequestDto
  ): Promise<AuthTokenResultDto | KakaoSignupRequiredResultDto> {
    const kakaoUser = await this.requireKakaoUser(body.kakaoAccessToken);

    const existingOauth = await prisma.oauth.findUnique({
      where: {
        socialType_providerId: {
          socialType: SocialType.KAKAO,
          providerId: kakaoUser.providerId,
        },
      },
      include: { user: true },
    });

    if (existingOauth) {
      const tokens = await this.issueTokens(
        existingOauth.user,
        kakaoUser.providerId
      );
      return {
        ...tokens,
        user: this.toAuthUser(existingOauth.user),
      };
    }

    const email = kakaoUser.email.toLowerCase();
    const emailUser = await prisma.user.findUnique({
      where: { email },
      include: { oauths: true },
    });

    if (emailUser) {
      const hasKakao = emailUser.oauths.some(
        (oauth) => oauth.socialType === SocialType.KAKAO
      );
      const hasLocal = emailUser.oauths.some(
        (oauth) => oauth.socialType === SocialType.LOCAL
      );

      if (hasKakao) {
        throw new AppError({
          code: AUTH_CODES.KAKAO_EMAIL_CONFLICT,
          message: AUTH_MESSAGES.KAKAO_EMAIL_CONFLICT,
          statusCode: 409,
        });
      }

      if (hasLocal) {
        throw new AppError({
          code: AUTH_CODES.LINK_ACCOUNT_REQUIRED,
          message: AUTH_MESSAGES.LINK_ACCOUNT_REQUIRED_LOCAL,
          statusCode: 409,
          result: {
            existingSocialType: "LOCAL",
            email: this.maskEmail(emailUser.email),
            nextStep: "LINK_ACCOUNT",
          },
        });
      }
    }

    return {
      email,
      nickname: kakaoUser.nickname,
      nextStep: "KAKAO_SIGNUP",
    };
  }

  async kakaoSignup(body: KakaoSignupRequestDto): Promise<AuthTokenResultDto> {
    if (
      !body.name ||
      !body.nickname ||
      !body.birth ||
      !Array.isArray(body.termAgreements) ||
      body.termAgreements.length === 0 ||
      !isValidName(body.name) ||
      !isValidNickname(body.nickname) ||
      !isValidBirth(body.birth)
    ) {
      throw new AppError({
        code: AUTH_CODES.KAKAO_SIGNUP_INVALID_REQUEST,
        message: AUTH_MESSAGES.KAKAO_SIGNUP_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    for (const agreement of body.termAgreements) {
      if (!agreement.agreed) {
        throw new AppError({
          code: AUTH_CODES.KAKAO_SIGNUP_INVALID_REQUEST,
          message: AUTH_MESSAGES.KAKAO_SIGNUP_INVALID_REQUEST,
          statusCode: 400,
        });
      }
    }

    await this.validateTermAgreements(body.termAgreements);

    const kakaoUser = await this.requireKakaoUser(body.kakaoAccessToken);
    const nickname = body.nickname.trim();
    const name = body.name.trim();
    const email = kakaoUser.email.toLowerCase();

    const existingOauth = await prisma.oauth.findUnique({
      where: {
        socialType_providerId: {
          socialType: SocialType.KAKAO,
          providerId: kakaoUser.providerId,
        },
      },
    });
    if (existingOauth) {
      throw new AppError({
        code: AUTH_CODES.KAKAO_SIGNUP_INVALID_REQUEST,
        message: AUTH_MESSAGES.KAKAO_SIGNUP_INVALID_REQUEST,
        statusCode: 400,
      });
    }

    await this.assertNicknameAvailable(nickname);

    const emailUser = await prisma.user.findUnique({
      where: { email },
      select: { uid: true },
    });
    if (emailUser) {
      throw new AppError({
        code: AUTH_CODES.EMAIL_DUPLICATE,
        message: AUTH_MESSAGES.EMAIL_DUPLICATE,
        statusCode: 409,
      });
    }

    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            name,
            nickname,
            birth: parseBirthDate(body.birth),
          },
        });

        await tx.oauth.create({
          data: {
            uid: createdUser.uid,
            socialType: SocialType.KAKAO,
            providerId: kakaoUser.providerId,
            password: null,
            loginEmail: email,
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
    } catch (error) {
      if (this.isUniqueConstraintError(error, "email")) {
        throw new AppError({
          code: AUTH_CODES.EMAIL_DUPLICATE,
          message: AUTH_MESSAGES.EMAIL_DUPLICATE,
          statusCode: 409,
        });
      }
      if (this.isUniqueConstraintError(error, "nickname")) {
        throw new AppError({
          code: AUTH_CODES.NICKNAME_DUPLICATE,
          message: AUTH_MESSAGES.NICKNAME_DUPLICATE,
          statusCode: 409,
        });
      }
      throw error;
    }

    const tokens = await this.issueTokens(user, kakaoUser.providerId);

    return {
      ...tokens,
      user: this.toAuthUser(user),
    };
  }

  async logout(uid: string, body: LogoutRequestDto): Promise<void> {
    if (body.refreshToken) {
      const stored = await getRefreshTokenData(body.refreshToken);
      if (stored?.uid === uid) {
        await deleteRefreshToken(body.refreshToken);
        return;
      }
    }
    await deleteRefreshTokenByUid(uid);
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
      name: user.name,
      nickname: user.nickname,
      birth: formatBirthDate(user.birth),
      role: user.role,
      socialTypes: user.oauths.map((oauth) => oauth.socialType),
    };
  }
}

export const authService = new AuthService();
