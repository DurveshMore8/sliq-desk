import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import type { Ticket, TicketComment } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type RealtimeEvent =
  | { type: "ticket.created"; ticket: Ticket }
  | { type: "ticket.updated"; ticket: Ticket }
  | { type: "comment.created"; comment: TicketComment }
  | { type: "tickets.refresh" };

export function useRealtime(
  onEvent: (event: RealtimeEvent) => void,
  onResync: () => void,
) {
  const eventRef = useRef(onEvent);
  const resyncRef = useRef(onResync);

  useEffect(() => {
    eventRef.current = onEvent;
    resyncRef.current = onResync;
  });

  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });
    let connectedBefore = false;

    socket.on("connect", () => {
      if (connectedBefore) resyncRef.current();
      connectedBefore = true;
    });
    socket.on("ticket.created", (p: { ticket: Ticket }) =>
      eventRef.current({ type: "ticket.created", ticket: p.ticket }),
    );
    socket.on("ticket.updated", (p: { ticket: Ticket }) =>
      eventRef.current({ type: "ticket.updated", ticket: p.ticket }),
    );
    socket.on("comment.created", (p: { comment: TicketComment }) =>
      eventRef.current({ type: "comment.created", comment: p.comment }),
    );
    socket.on("tickets.refresh", () =>
      eventRef.current({ type: "tickets.refresh" }),
    );

    return () => {
      socket.disconnect();
    };
  }, []);
}
