import assert from "node:assert/strict";
import test from "node:test";
import { getGeminiInsightConfig } from "./gemini.config.js";

test("uses defaults for empty Gemini numeric environment variables", () => {
  const previousTimeout = process.env.GEMINI_INSIGHT_TIMEOUT_MS;
  const previousMaxRetries = process.env.GEMINI_INSIGHT_MAX_RETRIES;

  try {
    process.env.GEMINI_INSIGHT_TIMEOUT_MS = "   ";
    process.env.GEMINI_INSIGHT_MAX_RETRIES = "";

    const config = getGeminiInsightConfig();
    assert.equal(config.timeoutMs, 5_000);
    assert.equal(config.maxRetries, 1);
  } finally {
    if (previousTimeout === undefined) {
      delete process.env.GEMINI_INSIGHT_TIMEOUT_MS;
    } else {
      process.env.GEMINI_INSIGHT_TIMEOUT_MS = previousTimeout;
    }
    if (previousMaxRetries === undefined) {
      delete process.env.GEMINI_INSIGHT_MAX_RETRIES;
    } else {
      process.env.GEMINI_INSIGHT_MAX_RETRIES = previousMaxRetries;
    }
  }
});
