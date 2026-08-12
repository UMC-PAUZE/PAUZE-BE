import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "express";
import { AppError } from "../errors/app.error.js";
import { requireAdmin } from "./authorization.util.js";

test("ADMIN 사용자의 uid를 반환한다", () => {
  const request = { user: { uid: "admin-uid", role: "ADMIN" } } as Request;
  assert.equal(requireAdmin(request), "admin-uid");
});

test("인증되지 않은 요청은 401을 반환한다", () => {
  assert.throws(
    () => requireAdmin({} as Request),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 401,
  );
});

test("일반 사용자의 관리 API 요청은 403을 반환한다", () => {
  const request = { user: { uid: "user-uid", role: "USER" } } as Request;
  assert.throws(
    () => requireAdmin(request),
    (error: unknown) =>
      error instanceof AppError && error.statusCode === 403,
  );
});
