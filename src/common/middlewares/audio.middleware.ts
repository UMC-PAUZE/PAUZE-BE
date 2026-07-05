import { Request, Response, NextFunction } from 'express';
import { AUDIO_CODE, AUDIO_MESSAGE } from '../../modules/audio/errors/audio.error.js';

// 비즈니스 로직 에러 처리를 위한 커스텀 에러 클래스
export class AudioAppError extends Error {
    public code: string;
    public statusCode: number;

    constructor(code: string, message: string, statusCode: number = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AudioAppError.prototype);
    }
}

// 명세서 규격에 맞게 실패 응답을 포맷팅하는 전역 미들웨어
export const audioErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // 개발 중 디버깅용 로그
    console.error(`[Error Handler] ${err.stack || err}`);

    // 1. 우리가 정의한 커스텀 비즈니스 에러(AudioAppError)인 경우
    if (err instanceof AudioAppError) {
        return res.status(err.statusCode).json({
            isSuccess: false,
            code: err.code,
            message: err.message,
            result: null
        });
    }

    // 2. TSOA 등에서 발생하는 파라미터 유효성 검증 에러(BadRequest) 처리 예시
    if (err.status === 400 || err.name === 'ValidationError') {
        return res.status(400).json({
            isSuccess: false,
            code: AUDIO_CODE.BAD_REQUEST,
            message: err.message || AUDIO_MESSAGE.BAD_REQUEST,
            result: null
        });
    }

    // 3. 그 외 예측하지 못한 서버 내부 에러 (500 Internal Server Error)
    return res.status(500).json({
        isSuccess: false,
        code: "INTERNAL_SERVER_ERROR_500",
        message: "서버 내부 오류가 발생했습니다.",
        result: null
    });
};