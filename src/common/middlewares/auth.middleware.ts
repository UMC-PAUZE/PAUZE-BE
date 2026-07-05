import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app.error.js";
import { verifyAccessToken } from "../utils/jwt.util.js";

const PUBLIC_PATH_PREFIXES = [
  "/health",
  "/auth/signup",
  "/auth/login",
  "/auth/refresh",
];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
  );
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

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(
      new AppError({
        code: "AUTH_UNAUTHORIZED_401",
        message: "인증이 필요합니다.",
        statusCode: 401,
      })
    );
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
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
    const payload = verifyAccessToken(token);
    req.user = {
      uid: payload.uid,
      role: payload.role,
    };
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
