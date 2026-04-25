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
import { ClaimService } from "../../src/services/claim.service";

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeId() {
  return new Types.ObjectId().toHexString();
}

function makeClaim(overrides: Partial<IClaim> = {}): IClaim {
  return {
    _id: new Types.ObjectId(),
    title: "Test claim",
    description: "A short description",
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
    part: "Bumper",
    severity: Severity.LOW,
    imageUrl: "https://example.com/img.jpg",
    price: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Mock factories ────────────────────────────────────────────────────────────

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

describe("ClaimService", () => {
  let claimRepo: IClaimRepository;
  let damageRepo: IDamageRepository;
  let service: ClaimService;

  beforeEach(() => {
    claimRepo = makeClaimRepo();
    damageRepo = makeDamageRepo();
    service = new ClaimService(claimRepo, damageRepo);
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe("findAll", () => {
    it("returns all claims from repository", async () => {
      const claims = [makeClaim(), makeClaim()];
      vi.mocked(claimRepo.findAll).mockResolvedValue(claims);

      const result = await service.findAll();

      expect(result).toBe(claims);
      expect(claimRepo.findAll).toHaveBeenCalledOnce();
    });

    it("returns empty array when no claims exist", async () => {
      vi.mocked(claimRepo.findAll).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe("findById", () => {
    it("returns claim with damages when found", async () => {
      const id = makeId();
      const claim = makeClaim();
      const damages = [makeDamage()];

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findByClaimId).mockResolvedValue(damages);

      const result = await service.findById(id);

      expect(result.damages).toBe(damages);
      expect(claimRepo.findById).toHaveBeenCalledWith(id);
      expect(damageRepo.findByClaimId).toHaveBeenCalledWith(id);
    });

    it("throws UnprocessableEntityError when claim not found", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(null);

      await expect(service.findById(makeId())).rejects.toBeInstanceOf(
        UnprocessableEntityError,
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates and returns new claim", async () => {
      const data = { title: "New claim", description: "Desc" };
      const created = makeClaim(data);
      vi.mocked(claimRepo.create).mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toBe(created);
      expect(claimRepo.create).toHaveBeenCalledWith(data);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("updates and returns claim", async () => {
      const id = makeId();
      const claim = makeClaim();
      const updated = makeClaim({ title: "Updated" });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(claimRepo.update).mockResolvedValue(updated);

      const result = await service.update(id, { title: "Updated" });

      expect(result).toBe(updated);
    });

    it("throws NotFoundError when claim not found", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(null);

      await expect(
        service.update(makeId(), { title: "x" }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe("updateStatus", () => {
    it("transitions Pending → InReview successfully", async () => {
      const id = makeId();
      const claim = makeClaim({ status: ClaimStatus.PENDING });
      const updated = makeClaim({ status: ClaimStatus.IN_REVIEW });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(claimRepo.updateStatus).mockResolvedValue(updated);

      const result = await service.updateStatus(id, ClaimStatus.IN_REVIEW);

      expect(result.status).toBe(ClaimStatus.IN_REVIEW);
    });

    it("transitions InReview → Finished when no high-severity damage", async () => {
      const id = makeId();
      const claim = makeClaim({
        status: ClaimStatus.IN_REVIEW,
        description: "Short desc",
      });
      const updated = makeClaim({ status: ClaimStatus.FINISHED });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findByClaimId).mockResolvedValue([
        makeDamage({ severity: Severity.LOW }),
      ]);
      vi.mocked(claimRepo.updateStatus).mockResolvedValue(updated);

      const result = await service.updateStatus(id, ClaimStatus.FINISHED);

      expect(result.status).toBe(ClaimStatus.FINISHED);
    });

    it("transitions InReview → Finished when description > 100 chars and has high severity", async () => {
      const id = makeId();
      const longDesc = "A".repeat(101);
      const claim = makeClaim({
        status: ClaimStatus.IN_REVIEW,
        description: longDesc,
      });
      const updated = makeClaim({ status: ClaimStatus.FINISHED });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findByClaimId).mockResolvedValue([
        makeDamage({ severity: Severity.HIGH }),
      ]);
      vi.mocked(claimRepo.updateStatus).mockResolvedValue(updated);

      const result = await service.updateStatus(id, ClaimStatus.FINISHED);

      expect(result.status).toBe(ClaimStatus.FINISHED);
    });

    it("throws UnprocessableEntityError when high-severity damage and description ≤ 100 chars", async () => {
      const id = makeId();
      const claim = makeClaim({
        status: ClaimStatus.IN_REVIEW,
        description: "Short",
      });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(damageRepo.findByClaimId).mockResolvedValue([
        makeDamage({ severity: Severity.HIGH }),
      ]);

      await expect(
        service.updateStatus(id, ClaimStatus.FINISHED),
      ).rejects.toBeInstanceOf(UnprocessableEntityError);
    });

    it("throws UnprocessableEntityError for invalid transition Finished → Pending", async () => {
      const id = makeId();
      const claim = makeClaim({ status: ClaimStatus.FINISHED });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);

      await expect(
        service.updateStatus(id, ClaimStatus.PENDING),
      ).rejects.toBeInstanceOf(UnprocessableEntityError);
    });

    it("throws UnprocessableEntityError for invalid transition Pending → Finished", async () => {
      const id = makeId();
      const claim = makeClaim({ status: ClaimStatus.PENDING });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);

      await expect(
        service.updateStatus(id, ClaimStatus.FINISHED),
      ).rejects.toBeInstanceOf(UnprocessableEntityError);
    });

    it("throws NotFoundError when claim does not exist", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(null);

      await expect(
        service.updateStatus(makeId(), ClaimStatus.IN_REVIEW),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("transitions InReview → Pending (rollback)", async () => {
      const id = makeId();
      const claim = makeClaim({ status: ClaimStatus.IN_REVIEW });
      const updated = makeClaim({ status: ClaimStatus.PENDING });

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(claimRepo.updateStatus).mockResolvedValue(updated);

      const result = await service.updateStatus(id, ClaimStatus.PENDING);

      expect(result.status).toBe(ClaimStatus.PENDING);
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("deletes claim successfully", async () => {
      const id = makeId();
      const claim = makeClaim();

      vi.mocked(claimRepo.findById).mockResolvedValue(claim);
      vi.mocked(claimRepo.delete).mockResolvedValue(true);

      await expect(service.delete(id)).resolves.toBeUndefined();
      expect(claimRepo.delete).toHaveBeenCalledWith(id);
    });

    it("throws NotFoundError when claim not found", async () => {
      vi.mocked(claimRepo.findById).mockResolvedValue(null);

      await expect(service.delete(makeId())).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
