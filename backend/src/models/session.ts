import { Schema, model, type Types } from "mongoose";

export interface ISession {
  tokenHash: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISession>("Session", sessionSchema);
