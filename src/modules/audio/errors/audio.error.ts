export const AUDIO_CODE = {
    AUDIOGUID_NOT_FOUND: "AUDIOGUID_NOT_FOUND_404",
    BAD_REQUEST: "BAD_REQUEST_400",
    AUDIO_SAVE_FAILED: "AUDIO_SAVE_FAILED_500",
} as const;

export const AUDIO_MESSAGE = {
    AUDIOGUID_NOT_FOUND: "해당 청각 오디오 가이드를 찾을 수 없습니다.",
    BAD_REQUEST: "잘못된 요청 파라미터 형식입니다.",
    AUDIO_SAVE_FAILED: "청각 오디오 가이드 저장을 실패하였습니다.",
} as const;