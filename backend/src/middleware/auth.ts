import type { RequestHandler } from "express";
import type { HydratedDocument } from "mongoose";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";
import { hashToken } from "../lib/session.js";
import { Session, User } from "../models/index.js";
import type { IUser } from "../models/user.js";

export interface AuthContext {
  user: HydratedDocument<IUser>;
}

// Identity and organization always come from the server-side session, never from the request
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[config.cookieName];
  if (typeof token !== "string" || token === "") throw new AppError(401, "Not authenticated");

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) throw new AppError(401, "Not authenticated");

  const user = await User.findById(session.userId);
  if (!user) throw new AppError(401, "Not authenticated");

  req.auth = { user };
  next();
};
