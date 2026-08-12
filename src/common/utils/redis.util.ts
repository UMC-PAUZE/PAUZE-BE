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
  const ttl = getRefreshTtlSeconds();

  // 레거시 단일 세션 string 포인터 → 멀티 디바이스 set 마이그레이션
  const uidKeyType = await client.type(uidKey);
  if (uidKeyType === "string") {
    const oldRefreshId = await client.get(uidKey);
    await client.del(uidKey);
    if (oldRefreshId) {
      await client.sadd(uidKey, oldRefreshId);
    }
  }

  await client.hset(key, {
    uid: data.uid,
    provider_id: data.providerId,
    refresh_token: data.refreshToken,
  });
  await client.expire(key, ttl);
  await client.sadd(uidKey, refreshId);
  await client.expire(uidKey, ttl);

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

// 해당 기기 세션만 삭제하고, user_refresh set(또는 레거시 string)에서 id 제거
const DELETE_REFRESH_TOKEN_SCRIPT = `
local refreshKey = KEYS[1]
local expectedRefreshId = ARGV[1]
local uid = redis.call('HGET', refreshKey, 'uid')
redis.call('DEL', refreshKey)
if type(uid) == 'string' and uid ~= '' then
  local uidKey = 'user_refresh:' .. uid
  local keyType = redis.call('TYPE', uidKey)['ok']
  if keyType == 'set' then
    redis.call('SREM', uidKey, expectedRefreshId)
    if redis.call('SCARD', uidKey) == 0 then
      redis.call('DEL', uidKey)
    end
  elseif keyType == 'string' then
    if redis.call('GET', uidKey) == expectedRefreshId then
      redis.call('DEL', uidKey)
    end
  end
end
return 1
`;

// 유저의 모든 세션 삭제 (set 또는 레거시 string)
const DELETE_REFRESH_TOKEN_BY_UID_SCRIPT = `
local uidKey = KEYS[1]
local keyType = redis.call('TYPE', uidKey)['ok']
if keyType == 'set' then
  local refreshIds = redis.call('SMEMBERS', uidKey)
  for _, refreshId in ipairs(refreshIds) do
    redis.call('DEL', 'refresh:' .. refreshId)
  end
  redis.call('DEL', uidKey)
elseif keyType == 'string' then
  local refreshId = redis.call('GET', uidKey)
  if type(refreshId) == 'string' and refreshId ~= '' then
    redis.call('DEL', 'refresh:' .. refreshId)
  end
  redis.call('DEL', uidKey)
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

export class RefreshTokenNotFoundError extends Error {
  constructor() {
    super("Refresh token not found");
    this.name = "RefreshTokenNotFoundError";
  }
}

export async function rotateRefreshToken(
  oldRefreshToken: string,
  newRefreshToken: string
): Promise<void> {
  const existing = await getRefreshTokenData(oldRefreshToken);
  if (!existing) {
    throw new RefreshTokenNotFoundError();
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

export async function saveEmailVerified(
  email: string,
  purpose: EmailPendingPurpose
): Promise<void> {
  const client = getRedisClient();
  await client.set(
    `email:verified:${email}`,
    purpose,
    "EX",
    EMAIL_VERIFIED_TTL_SECONDS
  );
}

export async function isEmailVerified(
  email: string,
  purpose: EmailPendingPurpose
): Promise<boolean> {
  const client = getRedisClient();
  const value = await client.get(`email:verified:${email}`);
  return value === purpose;
}

export async function deleteEmailVerified(email: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`email:verified:${email}`);
}

export const EMAIL_CODE_EXPIRES_IN = EMAIL_CODE_TTL_SECONDS;
