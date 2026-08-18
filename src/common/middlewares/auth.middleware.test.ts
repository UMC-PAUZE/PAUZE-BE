import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/client.js";
import { AppError } from "../errors/app.error.js";
import { signAccessToken } from "../utils/jwt.util.js";
import { authenticate } from "./auth.middleware.js";

const JWT_ACCESS_SECRET = "test-access-secret-for-auth-middleware";

function request(method: string, path: string, token?: string): Request {
  return {
    method,
    path,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as Request;
}

function runAuthenticate(req: Request): unknown {
  let nextValue: unknown = Symbol("next-not-called");
  const next = ((error?: unknown) => {
    nextValue = error;
  }) as NextFunction;

  authenticate(req, {} as Response, next);
  return nextValue;
}

test("익명 GET /breathe-guides/file 요청을 허용한다", () => {
  const req = request("GET", "/breathe-guides/file");

  assert.equal(runAuthenticate(req), undefined);
});

test("익명 GET /visual-guides/file 요청을 허용한다", () => {
  const req = request("GET", "/visual-guides/file");

  assert.equal(runAuthenticate(req), undefined);
});

test("익명 POST /breathe-guides/upload 요청을 401로 거부한다", () => {
  const req = request("POST", "/breathe-guides/upload");
  const error = runAuthenticate(req);

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, "AUTH_UNAUTHORIZED_401");
});

test("익명 POST /visual-guides/upload 요청을 401로 거부한다", () => {
  const req = request("POST", "/visual-guides/upload");
  const error = runAuthenticate(req);

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, "AUTH_UNAUTHORIZED_401");
});

test("관리자 POST /breathe-guides/upload 요청을 인증한다", () => {
  const previousSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;

  try {
    const token = signAccessToken({ uid: "admin-uid", role: Role.ADMIN });
    const req = request("POST", "/breathe-guides/upload", token);

    assert.equal(runAuthenticate(req), undefined);
    assert.deepEqual(req.user, { uid: "admin-uid", role: Role.ADMIN });
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_ACCESS_SECRET;
    } else {
      process.env.JWT_ACCESS_SECRET = previousSecret;
    }
  }
});

test("관리자 POST /visual-guides/upload 요청을 인증한다", () => {
  const previousSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;

  try {
    const token = signAccessToken({ uid: "admin-uid", role: Role.ADMIN });
    const req = request("POST", "/visual-guides/upload", token);

    assert.equal(runAuthenticate(req), undefined);
    assert.deepEqual(req.user, { uid: "admin-uid", role: Role.ADMIN });
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_ACCESS_SECRET;
    } else {
      process.env.JWT_ACCESS_SECRET = previousSecret;
    }
  }
});
