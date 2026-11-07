import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { sendError } from "../lib/response.js";

function isBodyParseError(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed"
  );
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 404, "Route not found");
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    sendError(res, 400, "Validation failed", {
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  if (err instanceof AppError) {
    sendError(res, err.status, err.message, err.data);
    return;
  }
  if (isBodyParseError(err)) {
    sendError(res, 400, "Invalid JSON body");
    return;
  }
  console.error(err);
  sendError(res, 500, "Internal server error");
};
