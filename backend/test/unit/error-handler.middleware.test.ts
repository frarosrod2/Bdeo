import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssueCode } from "zod";
import { errorHandlerMiddleware } from "../../src/middlewares/error-handler.middleware";
import { BadRequestError, NotFoundError, UnprocessableEntityError, HttpError } from "../../src/common/errors/http-errors";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

const req = {} as Request;
const next = vi.fn() as unknown as NextFunction;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("errorHandlerMiddleware", () => {
  it("handles ZodError with 400", () => {
    const zodErr = new ZodError([
      {
        code: ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        message: "Title is required",
        path: ["title"],
      },
    ]);

    const res = makeRes();
    errorHandlerMiddleware(zodErr, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, error: "BadRequest" }),
    );
  });

  it("handles BadRequestError with 400", () => {
    const err = new BadRequestError("Invalid input");
    const res = makeRes();

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 400,
      error: "BadRequest",
      message: "Invalid input",
    });
  });

  it("handles NotFoundError with 404", () => {
    const err = new NotFoundError("Resource not found");
    const res = makeRes();

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 404,
      error: "NotFound",
      message: "Resource not found",
    });
  });

  it("handles UnprocessableEntityError with 422", () => {
    const err = new UnprocessableEntityError("Business rule violated");
    const res = makeRes();

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 422,
      error: "UnprocessableEntity",
      message: "Business rule violated",
    });
  });

  it("handles generic HttpError with its statusCode", () => {
    const err = new HttpError(409, "Conflict", "Already exists");
    const res = makeRes();

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 409,
      error: "Conflict",
      message: "Already exists",
    });
  });

  it("handles unknown errors with 500", () => {
    const err = new Error("Something exploded");
    const res = makeRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, error: "InternalServerError" }),
    );

    consoleSpy.mockRestore();
  });

  it("handles non-Error thrown values with 500", () => {
    const res = makeRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandlerMiddleware("raw string error", req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });
});