import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AIServiceError } from "../services/aiService.js";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    res.status(400).json({
      error: firstIssue?.message || "Invalid request payload.",
      code: "VALIDATION_ERROR",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  if (err instanceof AppError || err instanceof AIServiceError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    (err as { type?: string }).type === "entity.too.large"
  ) {
    res.status(413).json({
      error: "Request payload exceeds the allowed size limit.",
      code: "PAYLOAD_TOO_LARGE",
    });
    return;
  }

  if (typeof err === "object" && err !== null) {
    const httpErr = err as { statusCode?: number; status?: number; message?: string };
    const status = httpErr.statusCode ?? httpErr.status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      res.status(status).json({
        error: httpErr.message || "Request error.",
        code: status === 404 ? "NOT_FOUND" : "BAD_REQUEST",
      });
      return;
    }
  }

  console.error("[server] Unexpected error:", err);
  res.status(500).json({
    error: "An unexpected server error occurred. Please try again.",
    code: "INTERNAL_SERVER_ERROR",
  });
}
