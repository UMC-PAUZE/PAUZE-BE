import { createHash, randomBytes } from "crypto";

const SALT_BYTES = 32;

export function generateSalt(): string {
  return randomBytes(SALT_BYTES).toString("hex");
}

export function hashPassword(salt: string, password: string): string {
  return createHash("sha512").update(salt + password).digest("hex");
}

export function verifyPassword(
  salt: string,
  password: string,
  hashedPassword: string
): boolean {
  return hashPassword(salt, password) === hashedPassword;
}
