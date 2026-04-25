import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaimStatus, IClaim } from "../../src/models/claim.model";
import { IDamage, Severity } from "../../src/models/damage.model";
import { IClaimRepository } from "../../src/repositories/interfaces/claim-repository.interface";
import { IDamageRepository } from "../../src/repositories/interfaces/damage-repository.interface";
import { ClaimService } from "../../src/services/claim.service";
import { DamageService } from "../../src/services/damage.service";

function buildInMemoryRepos() {
  const claims = new Map<string, IClaim>();
  const damages = new Map<string, IDamage>();

  const claimRepo: IClaimRepository = {
    findAll: vi.fn(async () => [...claims.values()]),

    findById: vi.fn(async (id: string) => claims.get(id) ?? null),

    create: vi.fn(async (data) => {
      const claim: IClaim = {
        _id: new Types.ObjectId(),
        ...data,
        status: ClaimStatus.PENDING,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      claims.set(claim._id.toHexString(), claim);
      return claim;
    }),

    update: vi.fn(async (id, data) => {
      const c = claims.get(id);
      if (!c) return null;
      const updatedClaim: IClaim = { ...c, ...data, updatedAt: new Date() };
      claims.set(id, updatedClaim);
      return updatedClaim;
    }),

    updateStatus: vi.fn(async (id, status) => {
      const c = claims.get(id);
      if (!c) return null;
      const updatedClaim: IClaim = { ...c, status, updatedAt: new Date() };
      claims.set(id, updatedClaim);
      return updatedClaim;
    }),

    updateTotalAmount: vi.fn(async (id, totalAmount) => {
      const c = claims.get(id);
      if (!c) return null;
      const updatedClaim: IClaim = { ...c, totalAmount, updatedAt: new Date() };
      claims.set(id, updatedClaim);
      return updatedClaim;
    }),

    delete: vi.fn(async (id) => {
      return claims.delete(id);
    }),
  };

  const damageRepo: IDamageRepository = {
    findByClaimId: vi.fn(async (claimId: string) =>
      [...damages.values()].filter((d) => d.claimId.toHexString() === claimId),
    ),

    findById: vi.fn(async (id: string) => damages.get(id) ?? null),

    create: vi.fn(async (data) => {
      const damage: IDamage = {
        _id: new Types.ObjectId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      damages.set(damage._id.toHexString(), damage);
      return damage;
    }),

    update: vi.fn(async (id, data) => {
      const d = damages.get(id);
      if (!d) return null;
      const updatedDamage: IDamage = { ...d, ...data, updatedAt: new Date() };
      damages.set(id, updatedDamage);
      return updatedDamage;
    }),

    delete: vi.fn(async (id) => {
      return damages.delete(id);
    }),

    sumPricesByClaimId: vi.fn(async (claimId: string) => {
      return [...damages.values()]
        .filter((d) => d.claimId.toHexString() === claimId)
        .reduce((sum, d) => sum + d.price, 0);
    }),
  };

  return { claimRepo, damageRepo, claims, damages };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Integration: totalAmount = sum of damage prices", () => {
  let claimRepo: IClaimRepository;
  let damageRepo: IDamageRepository;
  let claims: Map<string, IClaim>;
  let claimService: ClaimService;
  let damageService: DamageService;

  beforeEach(() => {
    const repos = buildInMemoryRepos();
    claimRepo = repos.claimRepo;
    damageRepo = repos.damageRepo;
    claims = repos.claims;
    claimService = new ClaimService(claimRepo, damageRepo);
    damageService = new DamageService(claimRepo, damageRepo);
  });

  it("totalAmount starts at 0 on a new claim", async () => {
    const claim = await claimService.create({
      title: "Test",
      description: "Desc",
    });

    expect(claim.totalAmount).toBe(0);
  });

  it("totalAmount equals price of first damage after adding it", async () => {
    const claim = await claimService.create({ title: "T", description: "D" });
    const claimId = claim._id.toHexString();

    await damageService.create(claimId, {
      part: "Bumper",
      severity: Severity.LOW,
      imageUrl: "https://example.com/a.jpg",
      price: 300,
    });

    const stored = claims.get(claimId)!;
    expect(stored.totalAmount).toBe(300);
  });

  it("totalAmount equals sum of all damage prices after adding multiple damages", async () => {
    const claim = await claimService.create({ title: "T", description: "D" });
    const claimId = claim._id.toHexString();

    await damageService.create(claimId, {
      part: "Hood",
      severity: Severity.LOW,
      imageUrl: "https://example.com/a.jpg",
      price: 200,
    });
    await damageService.create(claimId, {
      part: "Door",
      severity: Severity.MID,
      imageUrl: "https://example.com/b.jpg",
      price: 450,
    });
    await damageService.create(claimId, {
      part: "Roof",
      severity: Severity.HIGH,
      imageUrl: "https://example.com/c.jpg",
      price: 1050,
    });

    const stored = claims.get(claimId)!;
    expect(stored.totalAmount).toBe(1700);
  });

  it("totalAmount updates correctly after updating a damage price", async () => {
    const claim = await claimService.create({ title: "T", description: "D" });
    const claimId = claim._id.toHexString();

    await damageService.create(claimId, {
      part: "Hood",
      severity: Severity.LOW,
      imageUrl: "https://example.com/a.jpg",
      price: 200,
    });
    const d2 = await damageService.create(claimId, {
      part: "Door",
      severity: Severity.MID,
      imageUrl: "https://example.com/b.jpg",
      price: 300,
    });

    // totalAmount should be 500 now
    expect(claims.get(claimId)!.totalAmount).toBe(500);

    // Update d2 price from 300 to 600
    await damageService.update(claimId, d2._id.toHexString(), { price: 600 });

    expect(claims.get(claimId)!.totalAmount).toBe(800);
  });

  it("totalAmount updates correctly after deleting a damage", async () => {
    const claim = await claimService.create({ title: "T", description: "D" });
    const claimId = claim._id.toHexString();

    const d1 = await damageService.create(claimId, {
      part: "Hood",
      severity: Severity.LOW,
      imageUrl: "https://example.com/a.jpg",
      price: 400,
    });
    await damageService.create(claimId, {
      part: "Door",
      severity: Severity.MID,
      imageUrl: "https://example.com/b.jpg",
      price: 100,
    });

    expect(claims.get(claimId)!.totalAmount).toBe(500);

    await damageService.delete(claimId, d1._id.toHexString());

    expect(claims.get(claimId)!.totalAmount).toBe(100);
  });

  it("totalAmount is 0 after deleting all damages", async () => {
    const claim = await claimService.create({ title: "T", description: "D" });
    const claimId = claim._id.toHexString();

    const d1 = await damageService.create(claimId, {
      part: "Hood",
      severity: Severity.LOW,
      imageUrl: "https://example.com/a.jpg",
      price: 250,
    });
    const d2 = await damageService.create(claimId, {
      part: "Door",
      severity: Severity.MID,
      imageUrl: "https://example.com/b.jpg",
      price: 350,
    });

    await damageService.delete(claimId, d1._id.toHexString());
    await damageService.delete(claimId, d2._id.toHexString());

    expect(claims.get(claimId)!.totalAmount).toBe(0);
  });

  it("non-price damage updates do not alter totalAmount", async () => {
    const claim = await claimService.create({ title: "T", description: "D" });
    const claimId = claim._id.toHexString();

    const d = await damageService.create(claimId, {
      part: "Bumper",
      severity: Severity.LOW,
      imageUrl: "https://example.com/a.jpg",
      price: 600,
    });

    expect(claims.get(claimId)!.totalAmount).toBe(600);

    // Update only the part name — totalAmount must remain unchanged
    await damageService.update(claimId, d._id.toHexString(), {
      part: "Front Bumper",
    });

    expect(claims.get(claimId)!.totalAmount).toBe(600);
    expect(claimRepo.updateTotalAmount).toHaveBeenCalledTimes(1); // only from create
  });

  it("totalAmount matches manual sum across multiple operations", async () => {
    const claim = await claimService.create({ title: "T", description: "D" });
    const claimId = claim._id.toHexString();

    const prices = [100, 250, 80, 420];
    const created: IDamage[] = [];

    for (const price of prices) {
      const d = await damageService.create(claimId, {
        part: "Part",
        severity: Severity.LOW,
        imageUrl: "https://example.com/img.jpg",
        price,
      });
      created.push(d);
    }

    const expectedSum = prices.reduce((a, b) => a + b, 0); // 850
    expect(claims.get(claimId)!.totalAmount).toBe(expectedSum);

    // Delete one damage and verify
    await damageService.delete(claimId, created[1]._id.toHexString()); // remove 250

    expect(claims.get(claimId)!.totalAmount).toBe(expectedSum - 250); // 600
  });
});
