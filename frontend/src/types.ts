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

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface UserRef {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: UserRef | null;
  createdBy: UserRef;
  firstResponseAt: string | null;
  slaDueAt: string | null;
  overdueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Assignee {
  id: string;
  name: string;
  role: Role;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  body: string;
  author: { id: string; name: string; role: Role | null };
  createdAt: string;
}
