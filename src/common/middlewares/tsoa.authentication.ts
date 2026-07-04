import type { Request } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";

export async function expressAuthentication(
  request: Request,
  securityName: string
): Promise<{ uid: string; role: string }> {
  if (securityName !== "bearer") {
    throw Object.assign(new Error(`Unknown security: ${securityName}`), {
      status: 401,
    });
  }

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw Object.assign(new Error("인증이 필요합니다."), { status: 401 });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw Object.assign(new Error("인증이 필요합니다."), { status: 401 });
  }

  try {
    return verifyAccessToken(token);
  } catch {
    throw Object.assign(new Error("유효하지 않은 access token입니다."), {
      status: 401,
    });
  }
}
