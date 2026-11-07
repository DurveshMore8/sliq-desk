import mongoose from "mongoose";
import { config } from "./config.js";
import { initModels } from "./models/index.js";

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 10_000 });
  await initModels();
}
