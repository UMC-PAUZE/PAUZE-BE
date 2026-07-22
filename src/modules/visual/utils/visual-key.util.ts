import { AppError } from "../../../common/errors/app.error.js";
import { VISUAL_CODES, VISUAL_MESSAGES } from "../errors/visual.errors.js";

const MAX_VISUAL_KEY_LENGTH = 255;
const VISUAL_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

export function parseVisualKey(key: string): string {
  const visualKey = key.trim();

  if (
    !visualKey ||
    visualKey.length > MAX_VISUAL_KEY_LENGTH ||
    !VISUAL_KEY_PATTERN.test(visualKey)
  ) {
    throw new AppError({
      code: VISUAL_CODES.BAD_REQUEST,
      message: VISUAL_MESSAGES.BAD_REQUEST,
      statusCode: 400,
    });
  }

  return visualKey;
}
