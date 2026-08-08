import { AppError } from "../../../common/errors/app.error.js";
import { AudioCategoryCode } from "../dto/audio.dto.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";

export function parseAudioCategoryCode(
  value: string | undefined,
): AudioCategoryCode {
  if (
    !value ||
    !Object.values(AudioCategoryCode).includes(value as AudioCategoryCode)
  ) {
    throw new AppError({
      code: AUDIO_CODES.INVALID_CATEGORY,
      message: AUDIO_MESSAGES.INVALID_CATEGORY,
      statusCode: 400,
    });
  }

  return value as AudioCategoryCode;
}
