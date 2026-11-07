export const ROLES = ["superadmin", "admin", "agent", "employee", "viewer"] as const;
export type Role = (typeof ROLES)[number];
