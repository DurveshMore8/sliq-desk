import type { RequestHandler } from "express";
import { z } from "zod";
import { toCommentDto, toCommentDtos } from "../lib/comment-dto.js";
import { AppError } from "../lib/errors.js";
import { findTicket } from "../lib/find-ticket.js";
import { EVENTS, emitToOrganization } from "../lib/realtime.js";
import { sendSuccess } from "../lib/response.js";
import { toTicketDto } from "../lib/ticket-dto.js";
import { checkComment, isStaff } from "../lib/ticket-rules.js";
import { Comment, Ticket } from "../models/index.js";

const createSchema = z.object({ body: z.string().trim().min(1).max(2000) });

export const listComments: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const ticket = await findTicket(req.params.id, actor.organizationId);

  const comments = await Comment.find({
    organizationId: actor.organizationId,
    ticketId: ticket._id,
  })
    .sort({ createdAt: 1, _id: 1 })
    .limit(500);

  sendSuccess(res, "Comments", { comments: await toCommentDtos(comments, actor.organizationId) });
};

export const createComment: RequestHandler = async (req, res) => {
  const actor = req.auth!.user;
  const { body } = createSchema.parse(req.body);
  const ticket = await findTicket(req.params.id, actor.organizationId);

  const result = checkComment(
    { id: String(actor._id), role: actor.role },
    { status: ticket.status, createdById: String(ticket.createdById) },
  );
  if (!result.allowed) throw new AppError(result.status, result.message);

  const comment = await Comment.create({
    organizationId: actor.organizationId,
    ticketId: ticket._id,
    authorId: actor._id,
    body,
  });
  const dto = await toCommentDto(comment);

  let responded = null;
  if (isStaff(actor.role)) {
    responded = await Ticket.findOneAndUpdate(
      { _id: ticket._id, organizationId: actor.organizationId, firstResponseAt: null },
      { $set: { firstResponseAt: new Date(), slaDueAt: null } },
      { new: true },
    );
  }

  emitToOrganization(actor.organizationId, EVENTS.commentCreated, { comment: dto });
  if (responded) {
    emitToOrganization(actor.organizationId, EVENTS.ticketUpdated, {
      ticket: await toTicketDto(responded),
    });
  }

  sendSuccess(res, "Comment added", { comment: dto }, 201);
};
