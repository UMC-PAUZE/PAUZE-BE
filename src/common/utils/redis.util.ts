import { createHash } from "crypto";
import { Redis } from "ioredis";
import { parseDurationToSeconds } from "./duration.util.js";

let redis: Redis | null = null;

const EMAIL_CODE_TTL_SECONDS = 300;
const EMAIL_CODE_RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_VERIFIED_TTL_SECONDS = 600;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;

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
  const uidKey = `user_refresh:${data.uid}`;

  const oldRefreshId = await client.get(uidKey);
  if (oldRefreshId && oldRefreshId !== refreshId) {
    await client.del(`refresh:${oldRefreshId}`);
  }

  await client.hset(key, {
    uid: data.uid,
    provider_id: data.providerId,
    refresh_token: data.refreshToken,
  });
  await client.expire(key, getRefreshTtlSeconds());
  await client.set(uidKey, refreshId, "EX", getRefreshTtlSeconds());

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

// Delete refresh hash and user_refresh:{uid} only when uid still maps to this refreshId.
const DELETE_REFRESH_TOKEN_SCRIPT = `
local refreshKey = KEYS[1]
local expectedRefreshId = ARGV[1]
local uid = redis.call('HGET', refreshKey, 'uid')
redis.call('DEL', refreshKey)
if type(uid) == 'string' and uid ~= '' then
  local uidKey = 'user_refresh:' .. uid
  if redis.call('GET', uidKey) == expectedRefreshId then
    redis.call('DEL', uidKey)
  end
end
return 1
`;

// Revoke mapped refresh record; delete user_refresh:{uid} only if it still matches.
const DELETE_REFRESH_TOKEN_BY_UID_SCRIPT = `
local uidKey = KEYS[1]
local refreshId = redis.call('GET', uidKey)
if type(refreshId) == 'string' and refreshId ~= '' then
  redis.call('DEL', 'refresh:' .. refreshId)
  if redis.call('GET', uidKey) == refreshId then
    redis.call('DEL', uidKey)
  end
end
return 1
`;

export async function deleteRefreshToken(refreshToken: string): Promise<void> {
  const client = getRedisClient();
  const refreshId = getRefreshId(refreshToken);
  await client.eval(
    DELETE_REFRESH_TOKEN_SCRIPT,
    1,
    `refresh:${refreshId}`,
    refreshId
  );
}

export async function deleteRefreshTokenByUid(uid: string): Promise<void> {
  const client = getRedisClient();
  await client.eval(
    DELETE_REFRESH_TOKEN_BY_UID_SCRIPT,
    1,
    `user_refresh:${uid}`
  );
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

export type EmailPendingPurpose = "SIGNUP" | "LINK";

export interface SignupPendingPayload {
  purpose: "SIGNUP";
  email: string;
  salt: string;
  hashedPassword: string;
  name: string;
  nickname: string;
  birth: string;
  termAgreements: Array<{ termId: number; agreed: boolean }>;
}

export interface LinkPendingPayload {
  purpose: "LINK";
  email: string;
  kakaoProviderId: string;
}

export type EmailPendingPayload = SignupPendingPayload | LinkPendingPayload;

/** Returns true when a send slot was claimed; false when still in cooldown. */
export async function claimEmailCodeSendSlot(email: string): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.set(
    `email:code:cooldown:${email}`,
    "1",
    "EX",
    EMAIL_CODE_RESEND_COOLDOWN_SECONDS,
    "NX"
  );
  return result === "OK";
}

export async function saveEmailCode(email: string, code: string): Promise<void> {
  const client = getRedisClient();
  await client.set(`email:code:${email}`, code, "EX", EMAIL_CODE_TTL_SECONDS);
}

export async function getEmailCode(email: string): Promise<string | null> {
  const client = getRedisClient();
  return client.get(`email:code:${email}`);
}

export async function deleteEmailCode(email: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`email:code:${email}`);
}

export async function incrementEmailCodeAttempts(
  email: string
): Promise<number> {
  const client = getRedisClient();
  const key = `email:code:attempts:${email}`;
  const attempts = await client.incr(key);
  if (attempts === 1) {
    await client.expire(key, EMAIL_CODE_TTL_SECONDS);
  }
  return attempts;
}

export async function deleteEmailCodeAttempts(email: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`email:code:attempts:${email}`);
}

export async function saveEmailPending(
  email: string,
  payload: EmailPendingPayload
): Promise<void> {
  const client = getRedisClient();
  await client.set(
    `email:pending:${email}`,
    JSON.stringify(payload),
    "EX",
    EMAIL_CODE_TTL_SECONDS
  );
}

export async function getEmailPending(
  email: string
): Promise<EmailPendingPayload | null> {
  const client = getRedisClient();
  const raw = await client.get(`email:pending:${email}`);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as EmailPendingPayload;
}

export async function deleteEmailPending(email: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`email:pending:${email}`);
}

export async function saveEmailVerified(email: string): Promise<void> {
  const client = getRedisClient();
  await client.set(`email:verified:${email}`, "1", "EX", EMAIL_VERIFIED_TTL_SECONDS);
}

export async function isEmailVerified(email: string): Promise<boolean> {
  const client = getRedisClient();
  const value = await client.get(`email:verified:${email}`);
  return value === "1";
}

export async function deleteEmailVerified(email: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`email:verified:${email}`);
}

export const EMAIL_CODE_EXPIRES_IN = EMAIL_CODE_TTL_SECONDS;
