import assert from "node:assert/strict";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import test from "node:test";
import {
  getUploadedFileBody,
  removeTemporaryUpload,
  removeTemporaryUploads,
} from "./uploaded-file.util.js";

test("메모리 업로드는 기존 Buffer를 S3 본문으로 사용한다", () => {
  const buffer = Buffer.from("audio");
  const file = { buffer } as Express.Multer.File;

  assert.equal(getUploadedFileBody(file), buffer);
});

test("디스크 업로드는 스트림으로 읽고 처리 후 임시 파일을 삭제한다", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "pauze-upload-test-"));
  const filePath = path.join(directory, "audio.tmp");
  await writeFile(filePath, "streamed audio");
  const file = { path: filePath } as Express.Multer.File;

  try {
    const body = getUploadedFileBody(file);
    assert.equal(body instanceof Readable, true);

    const chunks: Buffer[] = [];
    for await (const chunk of body as Readable) {
      chunks.push(Buffer.from(chunk));
    }
    assert.equal(Buffer.concat(chunks).toString(), "streamed audio");

    await removeTemporaryUpload(file);
    await assert.rejects(access(filePath), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("요청에 저장된 모든 임시 업로드 파일을 삭제한다", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "pauze-upload-test-"));
  const firstPath = path.join(directory, "first.tmp");
  const secondPath = path.join(directory, "second.tmp");
  await Promise.all([
    writeFile(firstPath, "first"),
    writeFile(secondPath, "second"),
  ]);

  try {
    await removeTemporaryUploads({
      files: {
        audioFile: [{ path: firstPath } as Express.Multer.File],
        visualFile: [{ path: secondPath } as Express.Multer.File],
      },
    } as Express.Request);

    await assert.rejects(access(firstPath), { code: "ENOENT" });
    await assert.rejects(access(secondPath), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
