export type Role = "superadmin" | "admin" | "agent" | "employee" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  organization: { id: string; name: string };
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  createdAt: string;
}
