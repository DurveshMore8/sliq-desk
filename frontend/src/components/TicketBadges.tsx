import { PRIORITY_LABELS, STATUS_LABELS } from "../lib/tickets";
import type { TicketPriority, TicketStatus } from "../types";

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`pill pill-status-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`pill pill-priority-${priority}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
