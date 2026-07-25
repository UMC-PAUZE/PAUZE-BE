export interface KakaoUserProfile {
  providerId: string;
  email: string;
  nickname: string;
}

interface KakaoUserMeResponse {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
    };
  };
}

const KAKAO_FETCH_TIMEOUT_MS = 10_000;

export async function fetchKakaoUser(
  kakaoAccessToken: string
): Promise<KakaoUserProfile | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KAKAO_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Kakao API error: ${response.status}`);
  }

  const data = (await response.json()) as KakaoUserMeResponse;
  const email = data.kakao_account?.email?.trim();
  const nickname = data.kakao_account?.profile?.nickname?.trim() ?? "";

  if (!data.id || !email) {
    return null;
  }

  return {
    providerId: String(data.id),
    email,
    nickname,
  };
}
