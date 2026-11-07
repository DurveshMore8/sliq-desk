export const ROLES = ["superadmin", "admin", "agent", "employee", "viewer"] as const;
export const ASSIGNABLE_ROLES = ["admin", "agent", "employee", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const STAFF_ROLES: readonly Role[] = ["superadmin", "admin", "agent"];
