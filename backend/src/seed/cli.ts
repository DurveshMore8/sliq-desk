import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { resetSeedData, seedDatabase } from "./seed.js";

const reset = process.argv.includes("--reset");

try {
  await connectDatabase();
  if (reset) {
    await resetSeedData();
    console.log("Removed existing demo data");
  }
  await seedDatabase();
} catch (err) {
  console.error("Seeding failed", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
