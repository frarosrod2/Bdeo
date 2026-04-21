import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../../src/common/errors/http-errors";
import { ClaimController } from "../../src/controllers/claim.controller";
import { ClaimStatus, IClaim } from "../../src/models/claim.model";
import { ClaimService } from "../../src/services/claim.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeClaim(overrides: Partial<IClaim> = {}): IClaim {
  return {
    _id: new Types.ObjectId(),
    title: "Claim",
    description: "Desc",
    status: ClaimStatus.PENDING,
    totalAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IClaim;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as unknown as Request;
}

function makeRes(): Response {
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

const next = vi.fn() as unknown as NextFunction;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ClaimController", () => {
  let service: ClaimService;
  let ctrl: ClaimController;

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    } as unknown as ClaimService;

    ctrl = new ClaimController(service);
    vi.mocked(next).mockReset();
  });

  // ── getAll ────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("responds 200 with claims array", async () => {
      const claims = [makeClaim()];
      vi.mocked(service.findAll).mockResolvedValue(claims);

      const req = makeReq();
      const res = makeRes();

      await ctrl.getAll(req, res, next);

      expect(res.json).toHaveBeenCalledWith(claims);
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next on error", async () => {
      const err = new Error("DB down");
      vi.mocked(service.findAll).mockRejectedValue(err);

      await ctrl.getAll(makeReq(), makeRes(), next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("responds 200 with claim detail", async () => {
      const claim = makeClaim();
      vi.mocked(service.findById).mockResolvedValue(claim as any);

      const req = makeReq({ params: { claimId: "abc" } });
      const res = makeRes();

      await ctrl.getById(req, res, next);

      expect(service.findById).toHaveBeenCalledWith("abc");
      expect(res.json).toHaveBeenCalledWith(claim);
    });

    it("calls next on NotFoundError", async () => {
      const err = new NotFoundError("not found");
      vi.mocked(service.findById).mockRejectedValue(err);

      await ctrl.getById(
        makeReq({ params: { claimId: "abc" } }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("responds 201 with created claim", async () => {
      const claim = makeClaim();
      vi.mocked(service.create).mockResolvedValue(claim);

      const req = makeReq({ body: { title: "T", description: "D" } });
      const res = makeRes();

      await ctrl.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(claim);
    });

    it("calls next on error", async () => {
      const err = new Error("create failed");
      vi.mocked(service.create).mockRejectedValue(err);

      await ctrl.create(makeReq(), makeRes(), next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("responds 200 with updated claim", async () => {
      const claim = makeClaim({ title: "Updated" });
      vi.mocked(service.update).mockResolvedValue(claim);

      const req = makeReq({
        params: { claimId: "abc" },
        body: { title: "Updated" },
      });
      const res = makeRes();

      await ctrl.update(req, res, next);

      expect(service.update).toHaveBeenCalledWith("abc", { title: "Updated" });
      expect(res.json).toHaveBeenCalledWith(claim);
    });

    it("calls next on error", async () => {
      const err = new NotFoundError("not found");
      vi.mocked(service.update).mockRejectedValue(err);

      await ctrl.update(
        makeReq({ params: { claimId: "abc" }, body: {} }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe("updateStatus", () => {
    it("responds 200 with claim at new status", async () => {
      const claim = makeClaim({ status: ClaimStatus.IN_REVIEW });
      vi.mocked(service.updateStatus).mockResolvedValue(claim);

      const req = makeReq({
        params: { claimId: "abc" },
        body: { status: "InReview" },
      });
      const res = makeRes();

      await ctrl.updateStatus(req, res, next);

      expect(service.updateStatus).toHaveBeenCalledWith("abc", "InReview");
      expect(res.json).toHaveBeenCalledWith(claim);
    });

    it("calls next on error", async () => {
      const err = new Error("transition error");
      vi.mocked(service.updateStatus).mockRejectedValue(err);

      await ctrl.updateStatus(
        makeReq({ params: { claimId: "abc" }, body: { status: "Finished" } }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe("remove", () => {
    it("responds 204 on successful delete", async () => {
      vi.mocked(service.delete).mockResolvedValue(undefined);

      const req = makeReq({ params: { claimId: "abc" } });
      const res = makeRes();

      await ctrl.remove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("calls next on error", async () => {
      const err = new NotFoundError("not found");
      vi.mocked(service.delete).mockRejectedValue(err);

      await ctrl.remove(
        makeReq({ params: { claimId: "abc" } }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
