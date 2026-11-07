import type { RequestHandler } from "express";
import { isValidObjectId, type HydratedDocument, type Types } from "mongoose";
import { z } from "zod";
import { AppError, isDuplicateKeyError } from "../lib/errors.js";
import { sendTemporaryPasswordEmail } from "../lib/mailer.js";
import { generateTemporaryPassword, hashPassword } from "../lib/password.js";
import { canManage } from "../lib/permissions.js";
import { EVENTS, disconnectUser, emitToOrganization } from "../lib/realtime.js";
import { sendSuccess } from "../lib/response.js";
import { ASSIGNABLE_ROLES } from "../models/constants.js";
import { Organization, Session, Ticket, User } from "../models/index.js";
import type { IUser } from "../models/user.js";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const addMemberSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  role: z.enum(ASSIGNABLE_ROLES),
});

const changeRoleSchema = z.object({ role: z.enum(ASSIGNABLE_ROLES) });

function toMemberDto(user: HydratedDocument<IUser>) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  };
}

async function findMember(id: unknown, organizationId: Types.ObjectId) {
  if (typeof id !== "string" || !isValidObjectId(id)) throw new AppError(404, "Member not found");
  const member = await User.findOne({ _id: id, organizationId });
  if (!member) throw new AppError(404, "Member not found");
  return member;
}

async function emailTemporaryPassword(
  member: { name: string; email: string },
  organizationId: Types.ObjectId,
  temporaryPassword: string,
): Promise<boolean> {
  try {
    const org = await Organization.findById(organizationId);
    await sendTemporaryPasswordEmail({
      to: member.email,
      name: member.name,
      organizationName: org?.name ?? "your organization",
      temporaryPassword,
    });
    return true;
  } catch (err) {
    console.error("Failed to send temporary password email", err);
    return false;
  }
}

export const listMembers: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const members = await User.find({ organizationId: actor.organizationId }).sort({ createdAt: 1 });
  sendSuccess(res, "Members", { members: members.map(toMemberDto) });
};

export const addMember: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const { name, email, role } = addMemberSchema.parse(req.body);

  if (await User.exists({ email })) throw new AppError(409, "Email already registered");

  const temporaryPassword = generateTemporaryPassword();
  let member;
  try {
    member = await User.create({
      organizationId: actor.organizationId,
      email,
      name,
      role,
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new AppError(409, "Email already registered");
    throw err;
  }

  const emailSent = await emailTemporaryPassword(member, actor.organizationId, temporaryPassword);
  sendSuccess(
    res,
    emailSent
      ? "Member added. A temporary password was emailed."
      : "Member added, but the email could not be sent. Use resend to try again.",
    { member: toMemberDto(member), emailSent },
    201,
  );
};

export const changeRole: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const { role } = changeRoleSchema.parse(req.body);
  const member = await findMember(req.params.id, actor.organizationId);

  if (member._id.equals(actor._id)) throw new AppError(403, "You cannot change your own role");
  if (!canManage(actor.role, member.role)) {
    throw new AppError(403, "The organization owner cannot be modified");
  }

  if (member.role !== role) {
    member.role = role;
    await member.save();
  }
  sendSuccess(res, "Role updated", { member: toMemberDto(member) });
};

export const removeMember: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const member = await findMember(req.params.id, actor.organizationId);

  if (member._id.equals(actor._id)) throw new AppError(403, "You cannot remove yourself");
  if (!canManage(actor.role, member.role)) {
    throw new AppError(403, "The organization owner cannot be removed");
  }

  await User.deleteOne({ _id: member._id });
  await Session.deleteMany({ userId: member._id });
  const unassigned = await Ticket.updateMany(
    { organizationId: actor.organizationId, assigneeId: member._id, status: { $ne: "closed" } },
    { $set: { assigneeId: null } },
  );
  disconnectUser(member._id);
  if (unassigned.modifiedCount > 0) {
    emitToOrganization(actor.organizationId, EVENTS.ticketsRefresh);
  }
  sendSuccess(res, "Member removed");
};

export const resendPassword: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const member = await findMember(req.params.id, actor.organizationId);

  if (member._id.equals(actor._id)) {
    throw new AppError(403, "Use the change password option for your own account");
  }
  if (!canManage(actor.role, member.role)) {
    throw new AppError(403, "The organization owner cannot be modified");
  }

  const temporaryPassword = generateTemporaryPassword();
  member.passwordHash = await hashPassword(temporaryPassword);
  member.mustChangePassword = true;
  await member.save();
  await Session.deleteMany({ userId: member._id });
  disconnectUser(member._id);

  const emailSent = await emailTemporaryPassword(member, actor.organizationId, temporaryPassword);
  sendSuccess(
    res,
    emailSent
      ? "A new temporary password was emailed."
      : "Password reset, but the email could not be sent. Try again.",
    { member: toMemberDto(member), emailSent },
  );
};
