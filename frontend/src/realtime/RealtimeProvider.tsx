import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { io } from "socket.io-client";
import type { Ticket, TicketComment } from "../types";
import {
  RealtimeContext,
  type RealtimeContextValue,
  type RealtimeEvent,
  type RealtimeSubscriber,
} from "./context";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const subscribers = useRef<Set<RealtimeSubscriber>>(new Set());

  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });
    let connectedBefore = false;

    const dispatch = (event: RealtimeEvent) => {
      subscribers.current.forEach((s) => s.onEvent(event));
    };

    socket.on("connect", () => {
      if (connectedBefore) subscribers.current.forEach((s) => s.onResync());
      connectedBefore = true;
    });
    socket.on("ticket.created", (p: { ticket: Ticket }) =>
      dispatch({ type: "ticket.created", ticket: p.ticket }),
    );
    socket.on("ticket.updated", (p: { ticket: Ticket }) =>
      dispatch({ type: "ticket.updated", ticket: p.ticket }),
    );
    socket.on("comment.created", (p: { comment: TicketComment }) =>
      dispatch({ type: "comment.created", comment: p.comment }),
    );
    socket.on("sla.overdue", (p: { ticket: Ticket }) =>
      dispatch({ type: "sla.overdue", ticket: p.ticket }),
    );
    socket.on("tickets.refresh", () => dispatch({ type: "tickets.refresh" }));

    return () => {
      socket.disconnect();
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      subscribe: (subscriber) => {
        subscribers.current.add(subscriber);
        return () => {
          subscribers.current.delete(subscriber);
        };
      },
    }),
    [],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}
