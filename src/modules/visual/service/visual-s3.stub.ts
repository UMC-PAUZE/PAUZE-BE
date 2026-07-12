/**
 * S3 presigned URL 미구현 — 연동 전까지 DB에 저장된 URL을 반환합니다.
 */
export function getSignedVisualUrl(visualKey: string, fallbackUrl: string): string {
  void visualKey;
  return fallbackUrl;
}
