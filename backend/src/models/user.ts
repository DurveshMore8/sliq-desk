import { Schema, model, type Types } from "mongoose";
import { ROLES, type Role } from "./constants.js";

export interface IUser {
  organizationId: Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  mustChangePassword: boolean;
}

const userSchema = new Schema<IUser>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: [...ROLES], required: true },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ organizationId: 1, role: 1 });

userSchema.index(
  { organizationId: 1 },
  { unique: true, partialFilterExpression: { role: "superadmin" } },
);

export const User = model<IUser>("User", userSchema);
