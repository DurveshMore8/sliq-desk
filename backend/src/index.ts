import app from "./app.js";
import { connectDatabase } from "./db.js";

const port = Number(process.env.PORT ?? 4000);

async function main(): Promise<void> {
  await connectDatabase();
  console.log("Connected to MongoDB");

  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});
