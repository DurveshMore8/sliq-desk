import type { Response } from "express";

export interface ApiResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}

export function sendSuccess(
  res: Response,
  message: string,
  data: Record<string, unknown> = {},
  status = 200,
): void {
  const body: ApiResponse = { success: true, message, data };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  message: string,
  data: Record<string, unknown> = {},
): void {
  const body: ApiResponse = { success: false, message, data };
  res.status(status).json(body);
}
