import type { Response } from "express";
import type { Types } from "mongoose";
import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { Session, User } from "../models/index.js";

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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

export async function findSessionUser(token: unknown) {
  if (typeof token !== "string" || token === "") return null;
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  const user = await User.findById(session.userId);
  return user ? { session, user } : null;
}
