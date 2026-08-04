import type { SocialType } from "../../../generated/prisma/client.js";

export interface UserSettingsNotificationsDto {
  reminderAlarmActive: boolean;
  sensitiveAlarmActive: boolean;
}

export interface UserSettingsStabilityContentDto {
  breathingGuideEnabled: boolean;
  stabilitySoundEnabled: boolean;
  offlineContentEnabled: boolean;
}

export interface UserSettingsDto {
  notifications: UserSettingsNotificationsDto;
  stabilityContent: UserSettingsStabilityContentDto;
}

export interface UserMeResultDto {
  uid: string;
  nickname: string;
  profileImageUrl: string | null;
  socialTypes: SocialType[];
  settings: UserSettingsDto;
}

export interface UserProfileStatsDto {
  totalMeasurements: number | null;
  consecutiveDays: number | null;
  averageSensitivity: number | null;
}

export interface UserProfileResultDto {
  uid: string;
  name: string;
  nickname: string;
  introduction: string | null;
  profileImageUrl: string | null;
  email: string;
  socialTypes: SocialType[];
  joinedAt: string;
  stats: UserProfileStatsDto;
}

export interface UserProfileUpdateResultDto {
  uid: string;
  name: string;
  nickname: string;
  introduction: string | null;
  profileImageUrl: string | null;
}

export interface UpdateUserSettingsRequestDto {
  notifications?: {
    reminderAlarmActive?: boolean;
    sensitiveAlarmActive?: boolean;
  };
  stabilityContent?: {
    breathingGuideEnabled?: boolean;
    stabilitySoundEnabled?: boolean;
    offlineContentEnabled?: boolean;
  };
  pushToken?: string | null;
}

export interface WithdrawUserRequestDto {
  confirm: boolean;
}
