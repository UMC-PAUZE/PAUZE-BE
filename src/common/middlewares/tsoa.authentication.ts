import type { Request } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app.error.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import {
  AUTH_CODES,
  AUTH_MESSAGES,
} from "../../modules/auth/errors/auth.errors.js";

export async function expressAuthentication(
  request: Request,
  securityName: string
): Promise<{ uid: string; role: string }> {
  if (securityName !== "bearer") {
    throw new AppError({
      code: AUTH_CODES.UNAUTHORIZED,
      message: AUTH_MESSAGES.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError({
      code: AUTH_CODES.UNAUTHORIZED,
      message: AUTH_MESSAGES.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new AppError({
      code: AUTH_CODES.UNAUTHORIZED,
      message: AUTH_MESSAGES.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  try {
    return verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError({
        code: AUTH_CODES.UNAUTHORIZED,
        message: "유효하지 않은 access token입니다.",
        statusCode: 401,
      });
    }
    throw error;
  }
}
