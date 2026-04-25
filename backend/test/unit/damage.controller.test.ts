import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/common/errors/http-errors";
import { DamageController } from "../../src/controllers/damage.controller";
import { IDamage, Severity } from "../../src/models/damage.model";
import { DamageService } from "../../src/services/damage.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDamage(overrides: Partial<IDamage> = {}): IDamage {
  return {
    _id: new Types.ObjectId(),
    claimId: new Types.ObjectId(),
    part: "Bumper",
    severity: Severity.LOW,
    imageUrl: "https://example.com/img.jpg",
    price: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
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

describe("DamageController", () => {
  let service: DamageService;
  let ctrl: DamageController;

  beforeEach(() => {
    service = {
      findByClaimId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as DamageService;

    ctrl = new DamageController(service);
    vi.mocked(next).mockReset();
  });

  // ── getByClaimId ──────────────────────────────────────────────────────────

  describe("getByClaimId", () => {
    it("responds 200 with damages array", async () => {
      const damages = [makeDamage(), makeDamage()];
      vi.mocked(service.findByClaimId).mockResolvedValue(damages);

      const req = makeReq({ params: { claimId: "abc123" } });
      const res = makeRes();

      await ctrl.getByClaimId(req, res, next);

      expect(service.findByClaimId).toHaveBeenCalledWith("abc123");
      expect(res.json).toHaveBeenCalledWith(damages);
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next on NotFoundError", async () => {
      const err = new NotFoundError("Claim not found");
      vi.mocked(service.findByClaimId).mockRejectedValue(err);

      await ctrl.getByClaimId(
        makeReq({ params: { claimId: "abc123" } }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("responds 200 with single damage", async () => {
      const damage = makeDamage();
      vi.mocked(service.findById).mockResolvedValue(damage);

      const req = makeReq({ params: { claimId: "cid", damageId: "did" } });
      const res = makeRes();

      await ctrl.getById(req, res, next);

      expect(service.findById).toHaveBeenCalledWith("cid", "did");
      expect(res.json).toHaveBeenCalledWith(damage);
    });

    it("calls next on NotFoundError when damage missing", async () => {
      const err = new NotFoundError("Damage not found");
      vi.mocked(service.findById).mockRejectedValue(err);

      await ctrl.getById(
        makeReq({ params: { claimId: "cid", damageId: "did" } }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("responds 201 with created damage", async () => {
      const damage = makeDamage({ price: 500 });
      vi.mocked(service.create).mockResolvedValue(damage);

      const req = makeReq({
        params: { claimId: "cid" },
        body: {
          part: "Hood",
          severity: "mid",
          imageUrl: "https://example.com/img.jpg",
          price: 500,
        },
      });
      const res = makeRes();

      await ctrl.create(req, res, next);

      expect(service.create).toHaveBeenCalledWith("cid", req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(damage);
    });

    it("calls next when claim is not Pending", async () => {
      const err = new UnprocessableEntityError("Claim not in Pending status");
      vi.mocked(service.create).mockRejectedValue(err);

      await ctrl.create(
        makeReq({ params: { claimId: "cid" }, body: {} }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("responds 200 with updated damage", async () => {
      const damage = makeDamage({ price: 750 });
      vi.mocked(service.update).mockResolvedValue(damage);

      const req = makeReq({
        params: { claimId: "cid", damageId: "did" },
        body: { price: 750 },
      });
      const res = makeRes();

      await ctrl.update(req, res, next);

      expect(service.update).toHaveBeenCalledWith("cid", "did", { price: 750 });
      expect(res.json).toHaveBeenCalledWith(damage);
    });

    it("calls next on UnprocessableEntityError", async () => {
      const err = new UnprocessableEntityError("Claim not Pending");
      vi.mocked(service.update).mockRejectedValue(err);

      await ctrl.update(
        makeReq({
          params: { claimId: "cid", damageId: "did" },
          body: { price: 10 },
        }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });

    it("calls next on NotFoundError", async () => {
      const err = new NotFoundError("Damage not found");
      vi.mocked(service.update).mockRejectedValue(err);

      await ctrl.update(
        makeReq({
          params: { claimId: "cid", damageId: "did" },
          body: { part: "x" },
        }),
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

      const req = makeReq({ params: { claimId: "cid", damageId: "did" } });
      const res = makeRes();

      await ctrl.remove(req, res, next);

      expect(service.delete).toHaveBeenCalledWith("cid", "did");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("calls next on UnprocessableEntityError", async () => {
      const err = new UnprocessableEntityError("Claim not Pending");
      vi.mocked(service.delete).mockRejectedValue(err);

      await ctrl.remove(
        makeReq({ params: { claimId: "cid", damageId: "did" } }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });

    it("calls next on NotFoundError", async () => {
      const err = new NotFoundError("Damage not found");
      vi.mocked(service.delete).mockRejectedValue(err);

      await ctrl.remove(
        makeReq({ params: { claimId: "cid", damageId: "did" } }),
        makeRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
