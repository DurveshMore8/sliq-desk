import { createContext } from "react";
import type { Ticket, TicketComment } from "../types";

export type RealtimeEvent =
  | { type: "ticket.created"; ticket: Ticket }
  | { type: "ticket.updated"; ticket: Ticket }
  | { type: "comment.created"; comment: TicketComment }
  | { type: "sla.overdue"; ticket: Ticket }
  | { type: "tickets.refresh" };

export interface RealtimeSubscriber {
  onEvent: (event: RealtimeEvent) => void;
  onResync: () => void;
}

export interface RealtimeContextValue {
  subscribe: (subscriber: RealtimeSubscriber) => () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);
