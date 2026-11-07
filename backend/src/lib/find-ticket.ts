import { isValidObjectId, type Types } from "mongoose";
import { Ticket } from "../models/index.js";
import { AppError } from "./errors.js";

export async function findTicket(id: unknown, organizationId: Types.ObjectId) {
  if (typeof id !== "string" || !isValidObjectId(id)) throw new AppError(404, "Ticket not found");
  const ticket = await Ticket.findOne({ _id: id, organizationId });
  if (!ticket) throw new AppError(404, "Ticket not found");
  return ticket;
}
