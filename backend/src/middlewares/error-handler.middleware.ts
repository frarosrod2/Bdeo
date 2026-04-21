import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../common/errors/http-errors";

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join("; ");
    res.status(400).json({ statusCode: 400, error: "BadRequest", message });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      error: err.error,
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    statusCode: 500,
    error: "InternalServerError",
    message: "An unexpected error occurred.",
  });
}
