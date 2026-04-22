import {
  NotFoundError,
  UnprocessableEntityError,
} from "../common/errors/http-errors";
import { ClaimStatus, ClaimWithDamages, IClaim } from "../models/claim.model";
import { IClaimRepository } from "../repositories/interfaces/claim-repository.interface";
import { IDamageRepository } from "../repositories/interfaces/damage-repository.interface";

const ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  [ClaimStatus.PENDING]: [ClaimStatus.IN_REVIEW],
  [ClaimStatus.IN_REVIEW]: [ClaimStatus.FINISHED, ClaimStatus.PENDING],
  [ClaimStatus.FINISHED]: [],
};

export class ClaimService {
  constructor(
    private readonly claimRepo: IClaimRepository,
    private readonly damageRepo: IDamageRepository,
  ) {}

  async findAll(): Promise<IClaim[]> {
    return this.claimRepo.findAll();
  }

  async findById(id: string): Promise<ClaimWithDamages> {
    const claim = await this.claimRepo.findById(id);
    if (!claim) throw new UnprocessableEntityError(`Claim '${id}' not found.`);

    const damages = await this.damageRepo.findByClaimId(id);
    return { ...claim, damages };
  }

  async create(data: { title: string; description: string }): Promise<IClaim> {
    return this.claimRepo.create(data);
  }

  async update(
    id: string,
    data: Partial<Pick<IClaim, "title" | "description">>,
  ): Promise<IClaim> {
    const claim = await this.claimRepo.findById(id);
    if (!claim) throw new NotFoundError(`Claim '${id}' not found.`);

    const updated = await this.claimRepo.update(id, data);
    return updated!;
  }

  async updateStatus(id: string, newStatus: ClaimStatus): Promise<IClaim> {
    const claim = await this.claimRepo.findById(id);
    if (!claim) throw new NotFoundError(`Claim '${id}' not found.`);

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[claim.status];
    if (!allowed.includes(newStatus)) {
      throw new UnprocessableEntityError(
        `Transition from '${claim.status}' to '${newStatus}' is not allowed.`,
      );
    }

    if (newStatus === "Finished") {
      const damages = await this.damageRepo.findByClaimId(id);
      const hasHighSeverity = damages.some((d) => d.severity === "high");

      if (hasHighSeverity && claim.description.length <= 100) {
        throw new UnprocessableEntityError(
          "Claim has high-severity damages. Description must exceed 100 characters to mark as Finished.",
        );
      }
    }

    const updated = await this.claimRepo.updateStatus(id, newStatus);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    const claim = await this.claimRepo.findById(id);
    if (!claim) throw new NotFoundError(`Claim '${id}' not found.`);

    await this.claimRepo.delete(id);
  }
}
