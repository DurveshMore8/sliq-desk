import type { Ticket, TicketPriority, TicketStatus, User } from "../types";

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];
export const TICKET_PRIORITIES: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["open", "resolved"],
  resolved: ["open", "in_progress", "closed"],
  closed: [],
};

export function canCreateTicket(user: User): boolean {
  return user.role !== "viewer";
}

export interface TicketControls {
  statuses: TicketStatus[];
  priority: boolean;
  assignee: "none" | "self" | "any";
}

export function getTicketControls(user: User, ticket: Ticket): TicketControls {
  const none: TicketControls = {
    statuses: [],
    priority: false,
    assignee: "none",
  };

  if (user.role === "viewer" || ticket.status === "closed") return none;

  if (user.role === "employee") {
    const canReopen =
      ticket.status === "resolved" && ticket.createdBy.id === user.id;
    return { ...none, statuses: canReopen ? ["open"] : [] };
  }

  if (
    user.role === "agent" &&
    ticket.assignee &&
    ticket.assignee.id !== user.id
  )
    return none;

  return {
    statuses: TRANSITIONS[ticket.status],
    priority: true,
    assignee: user.role === "agent" ? "self" : "any",
  };
}
