import assert from "node:assert/strict";
import test from "node:test";
import {
  AUDIO_FILE_MAX_BYTES,
  isAllowedAudioFile,
  normalizeAudioTitle,
} from "./audio-file.util.js";

test("허용된 오디오 파일 형식을 검증한다", () => {
  assert.equal(
    isAllowedAudioFile({ originalname: "rain.mp3", mimetype: "audio/mpeg", size: 1 }),
    true,
  );
  assert.equal(
    isAllowedAudioFile({ originalname: "rain.mp3", mimetype: "application/octet-stream", size: 1 }),
    true,
  );
  assert.equal(
    isAllowedAudioFile({ originalname: "meditation.m4a", mimetype: "audio/mp4", size: 1 }),
    true,
  );
  assert.equal(
    isAllowedAudioFile({ originalname: "meditation.mp4", mimetype: "video/mp4", size: 1 }),
    false,
  );
  assert.equal(
    isAllowedAudioFile({ originalname: "image.jpg", mimetype: "image/jpeg", size: 1 }),
    false,
  );
  assert.equal(
    isAllowedAudioFile({
      originalname: "rain.mp3",
      mimetype: "audio/mpeg",
      size: AUDIO_FILE_MAX_BYTES,
    }),
    true,
  );
  assert.equal(
    isAllowedAudioFile({ originalname: "rain.mp3", mimetype: "audio/mpeg", size: AUDIO_FILE_MAX_BYTES + 1 }),
    false,
  );
});

test("오디오 제목을 정규화한다", () => {
  assert.equal(normalizeAudioTitle("  빗소리  "), "빗소리");
  assert.equal(normalizeAudioTitle("   "), null);
});
