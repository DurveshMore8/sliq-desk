import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const url = process.env.MONGO_URL ?? "mongodb://localhost:27017/helpdesk";
  await mongoose.connect(url, { serverSelectionTimeoutMS: 10_000 });
}
