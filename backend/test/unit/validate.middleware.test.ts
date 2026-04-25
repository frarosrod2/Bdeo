import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateMiddleware } from "../../src/middlewares/validate.middleware";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, params: {}, ...overrides } as Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("validateMiddleware", () => {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().min(0),
  });

  it("calls next() when body is valid", () => {
    const req = makeReq({ body: { name: "Alice", age: 30 } });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    validateMiddleware(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("mutates req.body with parsed (coerced) data", () => {
    const coerceSchema = z.object({ count: z.number() });
    const req = makeReq({ body: { count: 5 } });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    validateMiddleware(coerceSchema)(req, res, next);

    expect(req.body.count).toBe(5);
  });

  it("responds 400 when body is invalid", () => {
    const req = makeReq({ body: { name: "", age: -1 } });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    validateMiddleware(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, error: "BadRequest" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("includes validation messages in the 400 response", () => {
    const req = makeReq({ body: { name: "" } });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    validateMiddleware(schema)(req, res, next);

    const payload: { message: string } = vi.mocked(res.json).mock.calls[0][0];
    expect(payload.message).toContain("Name is required");
  });

  it("validates params when target is 'params'", () => {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const req = makeReq({ params: { id: "abc" } });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    validateMiddleware(paramsSchema, "params")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("responds 400 for invalid params", () => {
    const paramsSchema = z.object({ id: z.string().min(1, "ID required") });
    const req = makeReq({ params: { id: "" } });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    validateMiddleware(paramsSchema, "params")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("handles missing required fields gracefully", () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    validateMiddleware(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
