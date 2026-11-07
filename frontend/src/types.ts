export type Role = "superadmin" | "admin" | "agent" | "employee" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: { id: string; name: string };
}
