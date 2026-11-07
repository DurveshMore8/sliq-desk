import type { Role } from "../types";

export const ASSIGNABLE_ROLES = [
  "admin",
  "agent",
  "employee",
  "viewer",
] as const satisfies readonly Role[];
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  agent: "Agent",
  employee: "Employee",
  viewer: "Viewer",
};

export function canManageMembers(role: Role): boolean {
  return role === "superadmin" || role === "admin";
}
