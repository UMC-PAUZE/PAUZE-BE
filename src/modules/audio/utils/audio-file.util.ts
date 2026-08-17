import path from "node:path";

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
]);

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".flac",
]);

export const AUDIO_FILE_MAX_BYTES = 20 * 1024 * 1024;

export function isAllowedAudioFile(file: {
  mimetype: string;
  size: number;
  originalname?: string;
}): boolean {
  if (file.size <= 0 || file.size > AUDIO_FILE_MAX_BYTES) return false;

  const extension = path.extname(file.originalname ?? "").toLowerCase();
  if (!AUDIO_EXTENSIONS.has(extension)) return false;

  const mime = (file.mimetype || "").toLowerCase();
  return (
    AUDIO_MIME_TYPES.has(mime) ||
    mime === "application/octet-stream" ||
    mime === ""
  );
}

export function normalizeAudioTitle(value: string): string | null {
  const title = value.trim();
  return title.length >= 1 && title.length <= 50 ? title : null;
}
