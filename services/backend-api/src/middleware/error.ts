import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export const notFound: RequestHandler = (_req, res) =>
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid request", details: err.flatten() } });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "INVALID_JSON", message: "Malformed JSON body" } });
  }
  if (err?.code === "23505") {
    return res.status(409).json({ error: { code: "CONFLICT", message: "Resource already exists" } });
  }
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL", message: env.NODE_ENV === "production" ? "Internal server error" : String(err?.message ?? err) },
  });
};
