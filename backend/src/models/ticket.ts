import { Schema, model, type Types } from "mongoose";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "./constants.js";

export interface ITicket {
  organizationId: Types.ObjectId;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: Types.ObjectId | null;
  createdById: Types.ObjectId;
  firstResponseAt: Date | null;
  slaDueAt: Date | null;
  overdueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: [...TICKET_STATUSES], default: "open" },
    priority: { type: String, enum: [...TICKET_PRIORITIES], default: "medium" },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    firstResponseAt: { type: Date, default: null },
    slaDueAt: { type: Date, default: null },
    overdueAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ticketSchema.index({ organizationId: 1, createdAt: -1 });
ticketSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ organizationId: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ organizationId: 1, assigneeId: 1, createdAt: -1 });
ticketSchema.index({ slaDueAt: 1 });

export const Ticket = model<ITicket>("Ticket", ticketSchema);
