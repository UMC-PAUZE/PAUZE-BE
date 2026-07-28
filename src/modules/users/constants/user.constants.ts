import path from "node:path";

const NAME_SPECIAL_CHAR_REGEX = /[^\p{L}\p{N}\s]/u;
const PROFILE_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
  "image/heif",
]);
const PROFILE_IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".heic",
  ".heif",
]);
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const INTRODUCTION_MAX_LENGTH = 50;
const NAME_MAX_LENGTH = 10;
const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 10;

/** Empty form fields from Swagger/clients are treated as omitted. */
export function normalizeOptionalFormString(
  value: string | undefined
): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  return value;
}

export function isValidProfileName(name: string): boolean {
  if (name !== name.trim()) {
    return false;
  }
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > NAME_MAX_LENGTH) {
    return false;
  }
  return !NAME_SPECIAL_CHAR_REGEX.test(trimmed);
}

export function isValidProfileNickname(nickname: string): boolean {
  if (nickname !== nickname.trim()) {
    return false;
  }
  const trimmed = nickname.trim();
  return (
    trimmed.length >= NICKNAME_MIN_LENGTH &&
    trimmed.length <= NICKNAME_MAX_LENGTH
  );
}

export function isValidIntroduction(
  introduction: string | null | undefined
): boolean {
  if (introduction == null) {
    return true;
  }
  return introduction.length <= INTRODUCTION_MAX_LENGTH;
}

export function isAllowedProfileImage(file: {
  mimetype: string;
  size: number;
  originalname?: string;
}): boolean {
  if (file.size <= 0 || file.size > PROFILE_IMAGE_MAX_BYTES) {
    return false;
  }

  const mime = (file.mimetype || "").toLowerCase();
  if (PROFILE_IMAGE_MIME_TYPES.has(mime)) {
    return true;
  }

  // Postman/macOS may send application/octet-stream for local files
  if (mime === "application/octet-stream" || mime === "") {
    const ext = path.extname(file.originalname ?? "").toLowerCase();
    return PROFILE_IMAGE_EXTENSIONS.has(ext);
  }

  return false;
}

export function hasUploadedProfileImage(
  file: Express.Multer.File | undefined
): file is Express.Multer.File {
  return file != null && file.size > 0;
}

export function parseBooleanFormField(
  value: string | boolean | undefined
): boolean | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "") {
    return undefined;
  }
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return undefined;
}

export {
  INTRODUCTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PROFILE_IMAGE_MAX_BYTES,
};
