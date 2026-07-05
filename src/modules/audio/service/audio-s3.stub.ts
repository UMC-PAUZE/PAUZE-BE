/**
 * S3 presigned URL 미구현 — 연동 전까지 DB에 저장된 URL을 반환합니다.
 */
export function getSignedAudioUrl(audioKey: string, fallbackUrl: string): string {
  void audioKey;
  return fallbackUrl;
}
