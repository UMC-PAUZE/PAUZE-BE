import type { Request } from "express";
import { Role } from "../../generated/prisma/client.js";
import { AppError } from "../errors/app.error.js";
import {
  AUTH_CODES,
  AUTH_MESSAGES,
} from "../../modules/auth/errors/auth.errors.js";

export function requireAdmin(request: Request): string {
  const uid = request.user?.uid;
  if (!uid) {
    throw new AppError({
      code: AUTH_CODES.UNAUTHORIZED,
      message: AUTH_MESSAGES.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  if (request.user?.role !== Role.ADMIN) {
    throw new AppError({
      code: AUTH_CODES.FORBIDDEN,
      message: AUTH_MESSAGES.FORBIDDEN,
      statusCode: 403,
    });
  }

  return uid;
}
