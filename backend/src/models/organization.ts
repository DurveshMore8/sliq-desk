import { Schema, model } from "mongoose";

export interface IOrganization {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  { name: { type: String, required: true, trim: true } },
  { timestamps: true },
);

export const Organization = model<IOrganization>("Organization", organizationSchema);
