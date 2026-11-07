import type { HydratedDocument, Types } from "mongoose";
import { User } from "../models/index.js";
import type { ITicket } from "../models/ticket.js";
import { isOverdue } from "./sla.js";

export async function toTicketDtos(
  tickets: HydratedDocument<ITicket>[],
  organizationId: Types.ObjectId,
) {
  const ids = new Set<string>();
  for (const t of tickets) {
    ids.add(String(t.createdById));
    if (t.assigneeId) ids.add(String(t.assigneeId));
  }

  const users =
    ids.size > 0 ? await User.find({ _id: { $in: [...ids] }, organizationId }).select("name") : [];
  const names = new Map(users.map((u) => [String(u._id), u.name]));
  const ref = (id: Types.ObjectId) => ({
    id: String(id),
    name: names.get(String(id)) ?? "Removed user",
  });

  return tickets.map((t) => ({
    id: String(t._id),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignee: t.assigneeId ? ref(t.assigneeId) : null,
    createdBy: ref(t.createdById),
    firstResponseAt: t.firstResponseAt ?? null,
    overdue: isOverdue(t),
    slaDueAt: t.slaDueAt,
    overdueAt: t.overdueAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

export async function toTicketDto(ticket: HydratedDocument<ITicket>) {
  const [dto] = await toTicketDtos([ticket], ticket.organizationId);
  return dto!;
}
