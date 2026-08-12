export interface TermAgreementDto {
  termId: number;
  agreed: boolean;
}

/** Email-only: send signup verification code. */
export interface EmailCodeRequestDto {
  email: string;
}

/** Final local signup after email is verified. */
export interface LocalSignupRequestDto {
  name: string;
  nickname: string;
  birth: string;
  email: string;
  password: string;
  termAgreements: TermAgreementDto[];
}

export interface LocalLoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface EmailVerifyRequestDto {
  email: string;
  code: string;
}

export interface KakaoConfirmRequestDto {
  email: string;
  kakaoAccessToken: string;
}

/** LOCAL→KAKAO: send link verification code to email. */
export interface LinkEmailCodeRequestDto {
  email: string;
  kakaoAccessToken: string;
}

export interface KakaoLoginRequestDto {
  kakaoAccessToken: string;
}

export interface KakaoSignupRequestDto {
  name: string;
  nickname: string;
  birth: string;
  kakaoAccessToken: string;
  termAgreements: TermAgreementDto[];
}

/**
 * Link account.
 * - KAKAO→LOCAL: email + password (new local credentials) required
 * - LOCAL→KAKAO: kakaoAccessToken only (email optional; taken from token). Requires prior email verify.
 */
export interface LinkAccountRequestDto {
  kakaoAccessToken: string;
  email?: string;
  password?: string;
}

export interface LogoutRequestDto {
  refreshToken?: string;
}

export interface AuthUserDto {
  uid: string;
  email: string;
  name: string;
  nickname: string;
  birth: string;
}

export interface AuthTokenResultDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface EmailCodeSentResultDto {
  email: string;
  expiresIn: number;
  nextStep: "VERIFY_EMAIL";
}

export interface EmailVerifiedSignupResultDto {
  email: string;
  nextStep: "COMPLETE_SIGNUP";
}

export interface EmailVerifiedAskLinkResultDto {
  email: string;
  nextStep: "ASK_LINK";
}

export type EmailVerifiedResultDto =
  | EmailVerifiedSignupResultDto
  | EmailVerifiedAskLinkResultDto;

export interface KakaoSignupRequiredResultDto {
  email: string;
  nickname: string;
  nextStep: "KAKAO_SIGNUP";
}

export interface LinkAccountRequiredResultDto {
  existingSocialType: "KAKAO" | "LOCAL";
  email: string;
  nextStep?: "KAKAO_CONFIRM" | "LINK_ACCOUNT";
}

export type EmailAvailabilityStatus = "AVAILABLE" | "LOCAL" | "KAKAO";

export interface EmailAvailabilityResultDto {
  status: EmailAvailabilityStatus;
  email: string;
}

export interface NicknameAvailabilityResultDto {
  available: boolean;
  nickname: string;
}

export interface RefreshTokenResultDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthMeResultDto {
  uid: string;
  email: string;
  name: string;
  nickname: string;
  birth: string;
  role: string;
  socialTypes: string[];
}
