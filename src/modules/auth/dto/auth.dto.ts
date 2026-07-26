export interface TermAgreementDto {
  termId: number;
  agreed: boolean;
}

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

/** Email+password required when adding LOCAL to an existing KAKAO account. */
export type LinkAccountRequestDto =
  | {
      agree: boolean;
      kakaoAccessToken: string;
      email: string;
      password: string;
    }
  | {
      agree: boolean;
      kakaoAccessToken: string;
      email?: never;
      password?: string;
    };

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

export interface EmailVerifiedAskLinkResultDto {
  email: string;
  nextStep: "ASK_LINK";
}

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
