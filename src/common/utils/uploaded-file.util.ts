import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import type { Readable } from "node:stream";

export type UploadBody = Buffer | Readable;

export function getUploadedFileBody(file: Express.Multer.File): UploadBody {
  if (file.path) {
    return createReadStream(file.path);
  }
  return file.buffer;
}

export async function removeTemporaryUpload(
  file: Express.Multer.File | undefined,
): Promise<void> {
  if (!file?.path) {
    return;
  }

  try {
    await unlink(file.path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[Upload] temporary file cleanup failed", {
        path: file.path,
        error,
      });
    }
  }
}

export async function removeTemporaryUploads(
  request: Express.Request,
): Promise<void> {
  const files: Express.Multer.File[] = [];
  if (request.file) {
    files.push(request.file);
  }
  if (Array.isArray(request.files)) {
    files.push(...request.files);
  } else if (request.files) {
    files.push(...Object.values(request.files).flat());
  }

  await Promise.all(files.map((file) => removeTemporaryUpload(file)));
}
