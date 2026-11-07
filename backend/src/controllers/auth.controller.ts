import type { RequestHandler } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { AppError, isDuplicateKeyError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { sendSuccess } from "../lib/response.js";
import { clearSessionCookie, hashToken, startSession } from "../lib/session.js";
import { Organization, Session, User } from "../models/index.js";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  organizationName: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

// Compared against when the email is unknown, so response time doesn't reveal which emails exist
const dummyHash = hashPassword("not-a-real-password");

function toUserDto(
  user: { _id: unknown; name: string; email: string; role: string },
  org: { _id: unknown; name: string },
) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    organization: { id: String(org._id), name: org.name },
  };
}

// Creates a new organization with the signing-up user as its superadmin
export const signup: RequestHandler = async (req, res) => {
  const { name, email, organizationName, password } = signupSchema.parse(req.body);

  if (await User.exists({ email })) throw new AppError(409, "Email already registered");

  const passwordHash = await hashPassword(password);

  // Two writes without a transaction: remove the organization if creating the user fails
  const org = await Organization.create({ name: organizationName });
  let user;
  try {
    user = await User.create({
      organizationId: org._id,
      email,
      name,
      passwordHash,
      role: "superadmin",
    });
  } catch (err) {
    await Organization.deleteOne({ _id: org._id });
    if (isDuplicateKeyError(err)) throw new AppError(409, "Email already registered");
    throw err;
  }

  await startSession(res, user._id);
  sendSuccess(res, "Account created", { user: toUserDto(user, org) }, 201);
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid) throw new AppError(401, "Invalid email or password");

  const org = await Organization.findById(user.organizationId).orFail();
  await startSession(res, user._id);
  sendSuccess(res, "Logged in", { user: toUserDto(user, org) });
};

// Idempotent: works (and clears the cookie) even if the session is already gone
export const logout: RequestHandler = async (req, res) => {
  const token: unknown = req.cookies?.[config.cookieName];
  if (typeof token === "string" && token !== "") {
    await Session.deleteOne({ tokenHash: hashToken(token) });
  }
  clearSessionCookie(res);
  sendSuccess(res, "Logged out");
};

export const me: RequestHandler = async (req, res) => {
  const user = req.auth!.user;
  const org = await Organization.findById(user.organizationId).orFail();
  sendSuccess(res, "Current user", { user: toUserDto(user, org) });
};
