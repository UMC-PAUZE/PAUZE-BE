import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app.error.js";
import { verifyAccessToken } from "../utils/jwt.util.js";

const PUBLIC_PATH_PREFIXES = [
  "/health",
  "/auth/signup",
  "/auth/login",
  "/auth/refresh",
  "/auth/kakao",
  "/auth/email/verify",
  "/auth/link",
  "/visual-guides"
];

const OPTIONAL_AUTH_PATH_PREFIXES = ["/curation-posts"];

function matchesPathPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function isPublicPath(path: string): boolean {
  return matchesPathPrefix(path, PUBLIC_PATH_PREFIXES);
}

function isOptionalAuthPath(path: string): boolean {
  return matchesPathPrefix(path, OPTIONAL_AUTH_PATH_PREFIXES);
}

function isOptionalAudioRequest(method: string, path: string): boolean {
  if (method !== "GET") {
    return false;
  }
  return (
    path === "/audio-guides" ||
    path === "/audio-guides/" ||
    path === "/audio-guides/categories"
  );
}

function isOptionalAuthRequest(req: Request): boolean {
  return (
    isOptionalAudioRequest(req.method, req.path) || isOptionalAuthPath(req.path)
  );
}

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function setUserFromToken(req: Request, token: string): void {
  const payload = verifyAccessToken(token);
  req.user = {
    uid: payload.uid,
    role: payload.role,
  };
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (isPublicPath(req.path)) {
    next();
    return;
  }

  if (isOptionalAuthRequest(req)) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      next();
      return;
    }

    try {
      setUserFromToken(req, token);
      next();
    } catch {
      next(
        new AppError({
          code: "AUTH_UNAUTHORIZED_401",
          message: "유효하지 않은 access token입니다.",
          statusCode: 401,
        })
      );
    }
    return;
  }

  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    next(
      new AppError({
        code: "AUTH_UNAUTHORIZED_401",
        message: "인증이 필요합니다.",
        statusCode: 401,
      })
    );
    return;
  }

  try {
    setUserFromToken(req, token);
    next();
  } catch {
    next(
      new AppError({
        code: "AUTH_UNAUTHORIZED_401",
        message: "유효하지 않은 access token입니다.",
        statusCode: 401,
      })
    );
  }
}
