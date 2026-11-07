import {
  SLA_PRIORITIES,
  SLA_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "../models/constants.js";

export interface SlaState {
  priority: TicketPriority;
  status: TicketStatus;
  firstResponseAt: Date | null;
  overdueAt: Date | null;
  slaDueAt: Date | null;
}

export function nextSlaDueAt(ticket: SlaState, now: Date, slaMinutes: number): Date | null {
  const clockRuns =
    SLA_PRIORITIES.includes(ticket.priority) &&
    SLA_STATUSES.includes(ticket.status) &&
    !ticket.firstResponseAt &&
    !ticket.overdueAt;
  if (!clockRuns) return null;
  return ticket.slaDueAt ?? new Date(now.getTime() + slaMinutes * 60_000);
}

export function isOverdue(ticket: {
  status: TicketStatus;
  firstResponseAt?: Date | null;
  overdueAt?: Date | null;
}): boolean {
  return (
    Boolean(ticket.overdueAt) && !ticket.firstResponseAt && SLA_STATUSES.includes(ticket.status)
  );
}
