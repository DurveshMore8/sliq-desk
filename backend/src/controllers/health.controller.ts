import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { sendSuccess } from "../lib/response.js";

export const getHealth: RequestHandler = (_req, res) => {
  sendSuccess(res, "Service is healthy", {
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
};
