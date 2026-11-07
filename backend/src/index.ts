import { createServer } from "node:http";
import app from "./app.js";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { initRealtime } from "./lib/realtime.js";

async function main(): Promise<void> {
  await connectDatabase();
  console.log("Connected to MongoDB");

  const httpServer = createServer(app);
  initRealtime(httpServer);

  httpServer.listen(config.port, "0.0.0.0", () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});
