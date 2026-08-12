import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import { AudioCategoryCode } from "../../../generated/prisma/client.js";
import { parseAudioCategoryCode, parseOptionalAudioCategoryCode } from "./audio-category.util.js";

test("허용된 오디오 카테고리 코드를 반환한다", () => {
  assert.equal(
    parseAudioCategoryCode("NATURE_SOUND"),
    AudioCategoryCode.NATURE_SOUND,
  );
  assert.equal(parseAudioCategoryCode("ASMR"), AudioCategoryCode.ASMR);
  assert.equal(parseAudioCategoryCode("NOISE"), AudioCategoryCode.NOISE);
});

test("누락되거나 잘못된 카테고리 코드는 모듈 400 오류로 변환한다", () => {
  for (const value of [undefined, "", "MEDITATION", "nature_sound"]) {
    assert.throws(
      () => parseAudioCategoryCode(value),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, "AUDIO_GUIDE_INVALID_CATEGORY_400");
        return true;
      },
    );
  }
});

test("선택적 카테고리 코드는 생략 시 undefined를 반환한다", () => {
  assert.equal(parseOptionalAudioCategoryCode(undefined), undefined);
  assert.equal(parseOptionalAudioCategoryCode(""), undefined);
  assert.equal(
    parseOptionalAudioCategoryCode("ASMR"),
    AudioCategoryCode.ASMR,
  );
});
