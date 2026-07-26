import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../../common/errors/app.error.js";
import { VISUAL_CODES } from "../errors/visual.errors.js";
import { parseVisualKey } from "./visual-key.util.js";

test("returns a trimmed valid visual key", () => {
  assert.equal(parseVisualKey("  breathing_4-7-8  "), "breathing_4-7-8");
});

for (const [name, key] of [
  ["an empty key", "   "],
  ["a key longer than 255 characters", "a".repeat(256)],
  ["a key containing spaces", "deep breathing"],
  ["a key containing a slash", "visual/meditation"],
] as const) {
  test(`rejects ${name}`, () => {
    assert.throws(
      () => parseVisualKey(key),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, VISUAL_CODES.BAD_REQUEST);
        return true;
      },
    );
  });
}

test("accepts a visual key with exactly 255 characters", () => {
  const key = "a".repeat(255);

  assert.equal(parseVisualKey(key), key);
});
