export const ROLES = ["superadmin", "admin", "agent", "employee", "viewer"] as const;
export const ASSIGNABLE_ROLES = ["admin", "agent", "employee", "viewer"] as const;
export type Role = (typeof ROLES)[number];
