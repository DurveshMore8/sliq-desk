import type { RequestHandler } from "express";
import type { HydratedDocument } from "mongoose";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";
import { findSessionUser } from "../lib/session.js";
import type { Role } from "../models/constants.js";
import type { IUser } from "../models/user.js";

export interface AuthContext {
  user: HydratedDocument<IUser>;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const found = await findSessionUser(req.cookies?.[config.cookieName]);
  if (!found) throw new AppError(401, "Not authenticated");
  req.auth = { user: found.user };
  next();
};

export const requirePasswordChanged: RequestHandler = (req, _res, next) => {
  if (req.auth?.user.mustChangePassword) {
    throw new AppError(403, "You must change your temporary password before continuing", {
      code: "PASSWORD_CHANGE_REQUIRED",
    });
  }
  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = req.auth?.user;
    if (!user || !roles.includes(user.role)) {
      throw new AppError(403, "You do not have permission to do this");
    }
    next();
  };
}
