import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  // image
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".heif": "image/heif",
  // video
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  // audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
};

let s3Client: S3Client | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  s3Client = new S3Client({
    region: requireEnv("AWS_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });

  return s3Client;
}

function getBucket(): string {
  return requireEnv("S3_BUCKET");
}

export function buildProfileImageKey(
  uid: string,
  originalFilename: string
): string {
  const ext = path.extname(originalFilename).toLowerCase() || ".jpg";
  return `profiles/${uid}/${randomUUID()}${ext}`;
}

export function buildAudioKey(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  return `audio-guides/${randomUUID()}${ext}`;
}

export function buildVisualKey(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  return `visual-guides/${randomUUID()}${ext}`;
}

export function getObjectUrl(key: string): string {
  const base = requireEnv("S3_PUBLIC_BASE_URL").replace(/\/+$/, "");
  const normalizedKey = key.replace(/^\/+/, "");
  return `${base}/${normalizedKey}`;
}

/**
 * Resolve S3 Content-Type from filename extension.
 * Prefer extension over client mimetype (Postman often sends octet-stream).
 */
export function resolveContentType(
  filenameOrKey: string,
  fallbackMimetype?: string | null
): string {
  const ext = path.extname(filenameOrKey).toLowerCase();
  if (ext && EXT_TO_CONTENT_TYPE[ext]) {
    return EXT_TO_CONTENT_TYPE[ext];
  }

  const mime = (fallbackMimetype ?? "").trim().toLowerCase();
  if (mime && mime !== "application/octet-stream") {
    if (mime === "image/jpg") {
      return "image/jpeg";
    }
    return mime;
  }

  return "application/octet-stream";
}

export async function uploadObject(params: {
  key: string;
  body: Buffer;
  /** Original filename helps detect type when mimetype is wrong/empty */
  filename?: string;
  contentType?: string;
}): Promise<{ key: string; url: string; contentType: string }> {
  const contentType = resolveContentType(
    params.filename ?? params.key,
    params.contentType
  );

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.body,
      ContentType: contentType,
    })
  );

  return {
    key: params.key,
    url: getObjectUrl(params.key),
    contentType,
  };
}

export async function deleteObject(key: string): Promise<void> {
  if (!key) {
    return;
  }

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}
