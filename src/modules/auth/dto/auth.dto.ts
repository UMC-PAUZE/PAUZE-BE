export interface TermAgreementDto {
  termId: number;
  agreed: boolean;
}

export interface LocalSignupRequestDto {
  email: string;
  password: string;
  nickname: string;
  birth: string;
  termAgreements: TermAgreementDto[];
}

export interface LocalLoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface AuthUserDto {
  uid: string;
  email: string;
  nickname: string;
  birth: string;
}

export interface AuthTokenResultDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface LinkAccountRequiredResultDto {
  existingSocialType: "KAKAO";
  email: string;
}

export interface RefreshTokenResultDto {
  accessToken: string;
  refreshToken: string;
}
