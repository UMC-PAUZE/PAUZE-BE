import { AppError } from "../../../common/errors/app.error.js";
import type { AudioCategoryCode } from "../../../generated/prisma/client.js";
import { AudioCategoryCode as AudioCategoryCodeValues } from "../../../generated/prisma/client.js";
import { AUDIO_CODES, AUDIO_MESSAGES } from "../errors/audio.errors.js";

const VALID_CATEGORY_CODES = new Set<string>(
  Object.values(AudioCategoryCodeValues),
);

export function parseAudioCategoryCode(
  value: string | undefined,
): AudioCategoryCode {
  if (!value || !VALID_CATEGORY_CODES.has(value)) {
    throw new AppError({
      code: AUDIO_CODES.INVALID_CATEGORY,
      message: AUDIO_MESSAGES.INVALID_CATEGORY,
      statusCode: 400,
    });
  }

  return value as AudioCategoryCode;
}

export function parseOptionalAudioCategoryCode(
  value: string | undefined,
): AudioCategoryCode | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  return parseAudioCategoryCode(value);
}
