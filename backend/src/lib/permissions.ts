import type { Role } from "../models/constants.js";

export function canManageMembers(role: Role): boolean {
  return role === "superadmin" || role === "admin";
}

export function canManage(actor: Role, target: Role): boolean {
  return canManageMembers(actor) && target !== "superadmin";
}
