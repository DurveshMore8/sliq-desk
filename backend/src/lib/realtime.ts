import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { config } from "../config.js";
import { findSessionUser, hashToken } from "./session.js";

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1 || part.slice(0, index).trim() !== name) continue;
    const value = part.slice(index + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

export const EVENTS = {
  ticketCreated: "ticket.created",
  ticketUpdated: "ticket.updated",
  ticketsRefresh: "tickets.refresh",
  commentCreated: "comment.created",
  slaOverdue: "sla.overdue",
} as const;

let io: Server | null = null;

const orgRoom = (id: unknown) => `org:${String(id)}`;
const userRoom = (id: unknown) => `user:${String(id)}`;
const sessionRoom = (tokenHash: string) => `session:${tokenHash}`;

export function initRealtime(httpServer: HttpServer): Server {
  const server = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  server.use(async (socket, next) => {
    try {
      const origin = socket.handshake.headers.origin;
      if (origin !== undefined && origin !== config.corsOrigin) {
        return next(new Error("Forbidden origin"));
      }

      const token = readCookie(socket.handshake.headers.cookie, config.cookieName);
      const found = await findSessionUser(token);
      if (!token || !found || found.user.mustChangePassword) {
        return next(new Error("Not authenticated"));
      }

      socket.data.organizationId = String(found.user.organizationId);
      socket.data.userId = String(found.user._id);
      socket.data.sessionHash = hashToken(token);
      next();
    } catch (err) {
      console.error("Socket authentication failed", err);
      next(new Error("Authentication failed"));
    }
  });

  server.on("connection", (socket) => {
    void socket.join([
      orgRoom(socket.data.organizationId),
      userRoom(socket.data.userId),
      sessionRoom(socket.data.sessionHash as string),
    ]);
  });

  io = server;
  return server;
}

export function emitToOrganization(
  organizationId: unknown,
  event: string,
  payload: Record<string, unknown> = {},
): void {
  io?.to(orgRoom(organizationId)).emit(event, payload);
}

export function disconnectUser(userId: unknown): void {
  io?.in(userRoom(userId)).disconnectSockets(true);
}

export function disconnectSession(tokenHash: string): void {
  io?.in(sessionRoom(tokenHash)).disconnectSockets(true);
}

export function disconnectUserExceptSession(userId: unknown, tokenHash: string): void {
  io?.in(userRoom(userId)).except(sessionRoom(tokenHash)).disconnectSockets(true);
}
