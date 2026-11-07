import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function derive(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

export function generateTemporaryPassword(length = 12): string {
  let out = "";
  for (let i = 0; i < length; i++) out += TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)];
  return out;
}
