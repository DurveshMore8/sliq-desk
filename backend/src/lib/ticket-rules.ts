import {
  STAFF_ROLES,
  type Role,
  type TicketPriority,
  type TicketStatus,
} from "../models/constants.js";

export const STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["open", "resolved"],
  resolved: ["open", "in_progress", "closed"],
  closed: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function canCreateTicket(role: Role): boolean {
  return role !== "viewer";
}

export interface RuleActor {
  id: string;
  role: Role;
}

export interface RuleTicket {
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  createdById: string;
}

export interface RuleChanges {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

export type RuleResult = { allowed: true } | { allowed: false; status: 403 | 409; message: string };

const allow: RuleResult = { allowed: true };
const deny = (status: 403 | 409, message: string): RuleResult => ({
  allowed: false,
  status,
  message,
});

export function checkTicketUpdate(
  actor: RuleActor,
  ticket: RuleTicket,
  changes: RuleChanges,
): RuleResult {
  if (actor.role === "viewer") return deny(403, "Viewers cannot modify tickets");
  if (ticket.status === "closed") return deny(409, "Closed tickets cannot be changed");

  const nextStatus =
    changes.status !== undefined && changes.status !== ticket.status ? changes.status : null;
  const priorityChanged = changes.priority !== undefined && changes.priority !== ticket.priority;
  const assigneeChanged =
    changes.assigneeId !== undefined && changes.assigneeId !== ticket.assigneeId;

  if (actor.role === "employee") {
    const onlyReopensOwnTicket =
      nextStatus === "open" &&
      ticket.status === "resolved" &&
      !priorityChanged &&
      !assigneeChanged &&
      ticket.createdById === actor.id;
    return onlyReopensOwnTicket
      ? allow
      : deny(403, "Employees can only reopen their own resolved tickets");
  }

  if (actor.role === "agent") {
    if (ticket.assigneeId !== null && ticket.assigneeId !== actor.id) {
      return deny(403, "Agents can only change tickets assigned to them or unassigned");
    }
    if (assigneeChanged) {
      const claimsTicket = ticket.assigneeId === null && changes.assigneeId === actor.id;
      const releasesTicket = ticket.assigneeId === actor.id && changes.assigneeId === null;
      if (!claimsTicket && !releasesTicket) {
        return deny(
          403,
          "Agents can only assign an unassigned ticket to themselves or release their own",
        );
      }
    }
  }

  if (nextStatus !== null && !canTransition(ticket.status, nextStatus)) {
    return deny(409, `A ticket cannot move from ${ticket.status} to ${nextStatus}`);
  }

  return allow;
}

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function checkComment(
  actor: RuleActor,
  ticket: Pick<RuleTicket, "status" | "createdById">,
): RuleResult {
  if (actor.role === "viewer") return deny(403, "Viewers cannot add comments");
  if (actor.role === "employee" && ticket.createdById !== actor.id) {
    return deny(403, "Employees can only comment on their own tickets");
  }
  if (ticket.status === "closed") return deny(409, "Closed tickets cannot be commented on");
  return allow;
}
