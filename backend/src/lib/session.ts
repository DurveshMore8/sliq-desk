import type { Response } from "express";
import type { Types } from "mongoose";
import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { Session } from "../models/index.js";

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Creates a session and sets the httpOnly cookie
export async function startSession(res: Response, userId: Types.ObjectId): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + config.sessionDays * 24 * 60 * 60 * 1000);
  await Session.create({ tokenHash: hashToken(token), userId, expiresAt });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.cookieName, { path: "/" });
}
