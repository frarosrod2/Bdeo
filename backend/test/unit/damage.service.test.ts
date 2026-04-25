import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/common/errors/http-errors";
import { ClaimStatus, IClaim } from "../../src/models/claim.model";
import { IDamage, Severity } from "../../src/models/damage.model";
import { IClaimRepository } from "../../src/repositories/interfaces/claim-repository.interface";
import { IDamageRepository } from "../../src/repositories/interfaces/damage-repository.interface";
import { DamageService } from "../../src/services/damage.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId() {
  return new Types.ObjectId().toHexString();
}

function makeClaim(overrides: Partial<IClaim> = {}): IClaim {
  return {
    _id: new Types.ObjectId(),
    title: "Test claim",
    description: "Description",
    status: ClaimStatus.PENDING,
    totalAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDamage(overrides: Partial<IDamage> = {}): IDamage {
  return {
    _id: new Types.ObjectId(),
    claimId: new Types.ObjectId(),
    part: "Door",
    severity: Severity.LOW,
    imageUrl: "https://example.com/img.jpg",
    price: 200,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeClaimRepo(
  overrides: Partial<IClaimRepository> = {},
): IClaimRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    updateTotalAmount: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

function makeDamageRepo(
  overrides: Partial<IDamageRepository> = {},
): IDamageRepository {
  return {
    findByClaimId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    sumPricesByClaimId: vi.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DamageService", () => {
  let claimRepo: IClaimRepository;
  let damageRepo: IDamageRepository;
  let service: DamageService;

  beforeEach(() => {
    claimRepo = makeClaimRepo();
    damageRepo = makeDamageRepo();
    service = new DamageService(claimRepo, damageRepo);
  });

  // ── findByClaimId ─────────────────────────────────────────────────────────

  describe("findByClaimId", () => {
    it("returns damages for a valid claim", async () => {
      const claimId = makeId();
      const claim = makeClaim();
      const damages = [makeDamage(), makeDamage()];

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findByClaimId).mockResolvedValue(damages);

      const result = await service.findByClaimId(claimId);

      expect(result).toBe(damages);
      expect(damageRepo.findByClaimId).toHaveBeenCalledWith(claimId);
    });

    it("throws NotFoundError when claim does not exist", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(null);

      await expect(service.findByClaimId(makeId())).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe("findById", () => {
    it("returns damage when both claim and damage exist", async () => {
      const claimId = makeId();
      const damageId = makeId();
      const damage = makeDamage();

      vi.mocked(claimRepo.findById).mockResolvedValue(makeClaim());
      vi.mocked(damageRepo.findById).mockResolvedValue(damage);

      const result = await service.findById(claimId, damageId);

      expect(result).toBe(damage);
    });

    it("throws NotFoundError when claim does not exist", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(null);

      await expect(service.findById(makeId(), makeId())).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("throws NotFoundError when damage does not exist", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(makeClaim());
      vi.mocked(damageRepo.findById).mockResolvedValue(null);

      await expect(service.findById(makeId(), makeId())).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates damage and recalculates totalAmount", async () => {
      const claimId = makeId();
      const claim = makeClaim({ status: ClaimStatus.PENDING });
      const newDamage = makeDamage({ price: 300 });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.create).mockResolvedValue(newDamage);
      vi.mocked(damageRepo.sumPricesByClaimId).mockResolvedValue(300);
      vi.mocked(claimRepo.updateTotalAmount).mockResolvedValue(
        makeClaim({ totalAmount: 300 }),
      );

      const result = await service.create(claimId, {
        part: "Bumper",
        severity: Severity.LOW,
        imageUrl: "https://example.com/img.jpg",
        price: 300,
      });

      expect(result).toBe(newDamage);
      expect(damageRepo.sumPricesByClaimId).toHaveBeenCalledWith(claimId);
      expect(claimRepo.updateTotalAmount).toHaveBeenCalledWith(claimId, 300);
    });

    it("throws UnprocessableEntityError when claim is not Pending", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(
        makeClaim({ status: ClaimStatus.IN_REVIEW }),
      );

      await expect(
        service.create(makeId(), {
          part: "Hood",
          severity: Severity.MID,
          imageUrl: "https://example.com/img.jpg",
          price: 100,
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityError);
    });

    it("throws NotFoundError when claim does not exist", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(null);

      await expect(
        service.create(makeId(), {
          part: "Hood",
          severity: Severity.MID,
          imageUrl: "https://example.com/img.jpg",
          price: 100,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates damage and recalculates total when price changes", async () => {
      const claimId = makeId();
      const damageId = makeId();
      const claim = makeClaim({ status: ClaimStatus.PENDING });
      const existing = makeDamage({ price: 200 });
      const updated = makeDamage({ price: 350 });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findById).mockResolvedValue(existing);
      vi.mocked(damageRepo.update).mockResolvedValue(updated);
      vi.mocked(damageRepo.sumPricesByClaimId).mockResolvedValue(350);
      vi.mocked(claimRepo.updateTotalAmount).mockResolvedValue(null);

      const result = await service.update(claimId, damageId, { price: 350 });

      expect(result).toBe(updated);
      expect(claimRepo.updateTotalAmount).toHaveBeenCalledWith(claimId, 350);
    });

    it("updates damage without recalculating total when price not changed", async () => {
      const claimId = makeId();
      const damageId = makeId();
      const claim = makeClaim({ status: ClaimStatus.PENDING });
      const existing = makeDamage();
      const updated = makeDamage({ part: "Roof" });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findById).mockResolvedValue(existing);
      vi.mocked(damageRepo.update).mockResolvedValue(updated);

      const result = await service.update(claimId, damageId, { part: "Roof" });

      expect(result).toBe(updated);
      expect(claimRepo.updateTotalAmount).not.toHaveBeenCalled();
    });

    it("throws UnprocessableEntityError when claim is not Pending", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(
        makeClaim({ status: ClaimStatus.FINISHED }),
      );

      await expect(
        service.update(makeId(), makeId(), { price: 100 }),
      ).rejects.toBeInstanceOf(UnprocessableEntityError);
    });

    it("throws NotFoundError when damage does not exist", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(
        makeClaim({ status: ClaimStatus.PENDING }),
      );
      vi.mocked(damageRepo.findById).mockResolvedValue(null);

      await expect(
        service.update(makeId(), makeId(), { price: 100 }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("deletes damage and recalculates totalAmount", async () => {
      const claimId = makeId();
      const damageId = makeId();
      const claim = makeClaim({ status: ClaimStatus.PENDING });
      const damage = makeDamage();

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findById).mockResolvedValue(damage);
      vi.mocked(damageRepo.delete).mockResolvedValue(true);
      vi.mocked(damageRepo.sumPricesByClaimId).mockResolvedValue(0);
      vi.mocked(claimRepo.updateTotalAmount).mockResolvedValue(null);

      await expect(service.delete(claimId, damageId)).resolves.toBeUndefined();

      expect(damageRepo.delete).toHaveBeenCalledWith(damageId);
      expect(claimRepo.updateTotalAmount).toHaveBeenCalledWith(claimId, 0);
    });

    it("throws UnprocessableEntityError when claim is not Pending", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(
        makeClaim({ status: ClaimStatus.IN_REVIEW }),
      );

      await expect(service.delete(makeId(), makeId())).rejects.toBeInstanceOf(
        UnprocessableEntityError,
      );
    });

    it("throws NotFoundError when damage does not exist", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(
        makeClaim({ status: ClaimStatus.PENDING }),
      );
      vi.mocked(damageRepo.findById).mockResolvedValue(null);

      await expect(service.delete(makeId(), makeId())).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
