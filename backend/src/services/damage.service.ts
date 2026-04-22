import { Types } from "mongoose";
import {
  NotFoundError,
  UnprocessableEntityError,
} from "../common/errors/http-errors";
import { IDamage } from "../models/damage.model";
import { IClaimRepository } from "../repositories/interfaces/claim-repository.interface";
import { IDamageRepository } from "../repositories/interfaces/damage-repository.interface";

export class DamageService {
  constructor(
    private readonly claimRepo: IClaimRepository,
    private readonly damageRepo: IDamageRepository,
  ) {}

  private async assertClaimPending(claimId: string): Promise<void> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) throw new NotFoundError(`Claim '${claimId}' not found.`);
    if (claim.status !== "Pending") {
      throw new UnprocessableEntityError(
        "Damages can only be managed when the claim is in Pending status.",
      );
    }
  }

  private async recalculateTotal(claimId: string): Promise<void> {
    const total = await this.damageRepo.sumPricesByClaimId(claimId);
    await this.claimRepo.updateTotalAmount(claimId, total);
  }

  async findByClaimId(claimId: string): Promise<IDamage[]> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) throw new NotFoundError(`Claim '${claimId}' not found.`);
    return this.damageRepo.findByClaimId(claimId);
  }

  async findById(claimId: string, damageId: string): Promise<IDamage> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) throw new NotFoundError(`Claim '${claimId}' not found.`);

    const damage = await this.damageRepo.findById(damageId);
    if (!damage) throw new NotFoundError(`Damage '${damageId}' not found.`);

    return damage;
  }

  async create(
    claimId: string,
    data: Pick<IDamage, "part" | "severity" | "imageUrl" | "price">,
  ): Promise<IDamage> {
    await this.assertClaimPending(claimId);

    const damage = await this.damageRepo.create({
      claimId: new Types.ObjectId(claimId),
      ...data,
    });

    await this.recalculateTotal(claimId);
    return damage;
  }

  async update(
    claimId: string,
    damageId: string,
    data: Partial<Pick<IDamage, "part" | "severity" | "imageUrl" | "price">>,
  ): Promise<IDamage> {
    await this.assertClaimPending(claimId);

    const damage = await this.damageRepo.findById(damageId);
    if (!damage) throw new NotFoundError(`Damage '${damageId}' not found.`);

    const updated = await this.damageRepo.update(damageId, data);

    if (data.price !== undefined) {
      await this.recalculateTotal(claimId);
    }

    return updated!;
  }

  async delete(claimId: string, damageId: string): Promise<void> {
    await this.assertClaimPending(claimId);

    const damage = await this.damageRepo.findById(damageId);
    if (!damage) throw new NotFoundError(`Damage '${damageId}' not found.`);

    await this.damageRepo.delete(damageId);
    await this.recalculateTotal(claimId);
  }
}
