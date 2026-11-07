import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";
import { findTicket } from "../lib/find-ticket.js";
import { EVENTS, emitToOrganization } from "../lib/realtime.js";
import { sendSuccess } from "../lib/response.js";
import { nextSlaDueAt } from "../lib/sla.js";
import { toTicketDto, toTicketDtos } from "../lib/ticket-dto.js";
import { canCreateTicket, checkTicketUpdate } from "../lib/ticket-rules.js";
import {
  STAFF_ROLES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "../models/constants.js";
import { Ticket, User } from "../models/index.js";
import type { ITicket } from "../models/ticket.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  priority: z.enum(TICKET_PRIORITIES).default("medium"),
});

const listSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z
    .union([z.literal("me"), z.literal("unassigned"), z.string().regex(OBJECT_ID)])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const updateSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assigneeId: z.union([z.string().regex(OBJECT_ID), z.null()]).optional(),
  })
  .refine((b) => b.status !== undefined || b.priority !== undefined || b.assigneeId !== undefined, {
    message: "Provide at least one of status, priority or assigneeId",
  });

export const createTicket: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  if (!canCreateTicket(actor.role)) throw new AppError(403, "Viewers cannot create tickets");

  const body = createSchema.parse(req.body);
  const slaDueAt = nextSlaDueAt(
    {
      priority: body.priority,
      status: "open",
      firstResponseAt: null,
      overdueAt: null,
      slaDueAt: null,
    },
    new Date(),
    config.slaMinutes,
  );
  const ticket = await Ticket.create({
    ...body,
    organizationId: actor.organizationId,
    createdById: actor._id,
    slaDueAt,
  });
  const dto = await toTicketDto(ticket);
  emitToOrganization(actor.organizationId, EVENTS.ticketCreated, { ticket: dto });
  sendSuccess(res, "Ticket created", { ticket: dto }, 201);
};

export const listTickets: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const query = listSchema.parse(req.query);

  const filter: {
    organizationId: Types.ObjectId;
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: Types.ObjectId | null;
  } = { organizationId: actor.organizationId };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assigneeId === "me") filter.assigneeId = actor._id;
  else if (query.assigneeId === "unassigned") filter.assigneeId = null;
  else if (query.assigneeId) filter.assigneeId = new Types.ObjectId(query.assigneeId);

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Ticket.countDocuments(filter),
  ]);

  sendSuccess(res, "Tickets", {
    tickets: await toTicketDtos(tickets, actor.organizationId),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
};

export const getTicket: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const ticket = await findTicket(req.params.id, actor.organizationId);
  sendSuccess(res, "Ticket", { ticket: await toTicketDto(ticket) });
};

export const updateTicket: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const changes = updateSchema.parse(req.body);
  const ticket = await findTicket(req.params.id, actor.organizationId);
  const currentAssignee = ticket.assigneeId ? String(ticket.assigneeId) : null;

  const result = checkTicketUpdate(
    { id: String(actor._id), role: actor.role },
    {
      status: ticket.status,
      priority: ticket.priority,
      assigneeId: currentAssignee,
      createdById: String(ticket.createdById),
    },
    changes,
  );
  if (!result.allowed) throw new AppError(result.status, result.message);

  const update: Partial<Pick<ITicket, "status" | "priority" | "assigneeId" | "slaDueAt">> = {};
  if (changes.status !== undefined && changes.status !== ticket.status) {
    update.status = changes.status;
  }
  if (changes.priority !== undefined && changes.priority !== ticket.priority) {
    update.priority = changes.priority;
  }
  if (changes.assigneeId !== undefined && changes.assigneeId !== currentAssignee) {
    if (changes.assigneeId === null) {
      update.assigneeId = null;
    } else {
      const assignee = await User.exists({
        _id: changes.assigneeId,
        organizationId: actor.organizationId,
        role: { $in: [...STAFF_ROLES] },
      });
      if (!assignee)
        throw new AppError(400, "Assignee must be a staff member of your organization");
      update.assigneeId = new Types.ObjectId(changes.assigneeId);
    }
  }

  const nextDue = nextSlaDueAt(
    {
      priority: update.priority ?? ticket.priority,
      status: update.status ?? ticket.status,
      firstResponseAt: ticket.firstResponseAt,
      overdueAt: ticket.overdueAt,
      slaDueAt: ticket.slaDueAt,
    },
    new Date(),
    config.slaMinutes,
  );
  if (nextDue?.getTime() !== ticket.slaDueAt?.getTime()) update.slaDueAt = nextDue;

  if (Object.keys(update).length === 0) {
    sendSuccess(res, "No changes", { ticket: await toTicketDto(ticket) });
    return;
  }

  const updated = await Ticket.findOneAndUpdate(
    {
      _id: ticket._id,
      organizationId: actor.organizationId,
      status: ticket.status,
      assigneeId: ticket.assigneeId,
    },
    { $set: update },
    { new: true },
  );
  if (!updated) {
    throw new AppError(409, "This ticket was changed by someone else. Refresh and try again.");
  }

  const dto = await toTicketDto(updated);
  emitToOrganization(actor.organizationId, EVENTS.ticketUpdated, { ticket: dto });
  sendSuccess(res, "Ticket updated", { ticket: dto });
};

export const listAssignees: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const staff = await User.find({
    organizationId: actor.organizationId,
    role: { $in: [...STAFF_ROLES] },
  })
    .sort({ name: 1 })
    .select("name role");
  sendSuccess(res, "Assignees", {
    assignees: staff.map((u) => ({ id: String(u._id), name: u.name, role: u.role })),
  });
};
