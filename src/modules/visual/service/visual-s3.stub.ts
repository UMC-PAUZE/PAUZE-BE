/** S3 presigned URL 미구현 — 연동 전까지 DB URL을 fallback으로 사용합니다. */
export function getSignedVisualUrl(visualKey: string, fallbackUrl: string): string {
  void visualKey;
  return fallbackUrl;
}

const mockVisualUrls: Record<string, string> = {
  meditation: "https://example.com/mock/meditation.gif",
};

/** S3 연동 전 API 응답 확인을 위한 임시 URL입니다. */
export function getMockVisualUrl(visualKey: string): string | null {
  return mockVisualUrls[visualKey] ?? null;
}
