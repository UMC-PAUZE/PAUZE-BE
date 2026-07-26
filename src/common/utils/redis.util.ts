import { createHash } from "crypto";
import { Redis } from "ioredis";
import { parseDurationToSeconds } from "./duration.util.js";

let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const host = process.env.REDIS_HOST ?? "127.0.0.1";
    const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
    redis = new Redis({ host, port });
  }
  return redis;
}

export function getRefreshId(refreshToken: string): string {
  return createHash("sha512").update(refreshToken).digest("hex");
}

function getRefreshTtlSeconds(): number {
  return parseDurationToSeconds(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d");
}

export interface RefreshTokenData {
  uid: string;
  providerId: string;
  refreshToken: string;
}

export async function saveRefreshToken(data: RefreshTokenData): Promise<string> {
  const client = getRedisClient();
  const refreshId = getRefreshId(data.refreshToken);
  const key = `refresh:${refreshId}`;

  await client.hset(key, {
    uid: data.uid,
    provider_id: data.providerId,
    refresh_token: data.refreshToken,
  });
  await client.expire(key, getRefreshTtlSeconds());

  return refreshId;
}

export async function getRefreshTokenData(
  refreshToken: string
): Promise<RefreshTokenData | null> {
  const client = getRedisClient();
  const refreshId = getRefreshId(refreshToken);
  const key = `refresh:${refreshId}`;
  const stored = await client.hgetall(key);

  if (!stored.uid || !stored.provider_id || !stored.refresh_token) {
    return null;
  }

  return {
    uid: stored.uid,
    providerId: stored.provider_id,
    refreshToken: stored.refresh_token,
  };
}

export async function deleteRefreshToken(refreshToken: string): Promise<void> {
  const client = getRedisClient();
  const refreshId = getRefreshId(refreshToken);
  await client.del(`refresh:${refreshId}`);
}

export async function rotateRefreshToken(
  oldRefreshToken: string,
  newRefreshToken: string
): Promise<void> {
  const existing = await getRefreshTokenData(oldRefreshToken);
  if (!existing) {
    return;
  }

  await deleteRefreshToken(oldRefreshToken);
  await saveRefreshToken({
    uid: existing.uid,
    providerId: existing.providerId,
    refreshToken: newRefreshToken,
  });
}
