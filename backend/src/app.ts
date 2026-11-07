import cors from "cors";
import express from "express";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
