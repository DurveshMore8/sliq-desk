import { Schema, model, type Types } from "mongoose";

export interface IComment {
  organizationId: Types.ObjectId;
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

commentSchema.index({ organizationId: 1, ticketId: 1, createdAt: 1 });

export const Comment = model<IComment>("Comment", commentSchema);
