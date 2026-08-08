import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app.error.js";
import { authenticate } from "./auth.middleware.js";

function runAuthenticate(method: string, path: string): unknown {
  const request = {
    method,
    path,
    headers: {},
  } as Request;
  let nextValue: unknown = Symbol("not-called");
  const next = ((value?: unknown) => {
    nextValue = value;
  }) as NextFunction;

  authenticate(request, {} as Response, next);
  return nextValue;
}

test("오디오 전체 및 카테고리 GET은 토큰 없이 접근할 수 있다", () => {
  assert.equal(runAuthenticate("GET", "/audio-guides"), undefined);
  assert.equal(runAuthenticate("GET", "/audio-guides/"), undefined);
  assert.equal(
    runAuthenticate("GET", "/audio-guides/categories"),
    undefined,
  );
});

test("오디오 좋아요와 저장 API는 토큰 없으면 공통 401을 반환한다", () => {
  const protectedRequests: Array<[string, string]> = [
    ["GET", "/audio-guides/likes"],
    ["GET", "/audio-guides/saves"],
    ["PATCH", "/audio-guides/1/likes"],
    ["PATCH", "/audio-guides/1/saves"],
  ];

  for (const [method, path] of protectedRequests) {
    const error = runAuthenticate(method, path);
    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.code, "AUTH_UNAUTHORIZED_401");
    assert.equal(error.message, "인증이 필요합니다.");
  }
});
