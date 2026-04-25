import { ClaimModel, ClaimStatus, IClaim } from "../models/claim.model";
import { IClaimRepository } from "./interfaces/claim-repository.interface";

export class ClaimRepository implements IClaimRepository {
  async findAll(): Promise<IClaim[]> {
    return ClaimModel.find().sort({ createdAt: -1 }).lean<IClaim[]>();
  }

  async findById(id: string): Promise<IClaim | null> {
    return ClaimModel.findById(id).lean<IClaim>();
  }

  async create(data: { title: string; description: string }): Promise<IClaim> {
    const claim = await ClaimModel.create({
      ...data,
      status: "Pending",
      totalAmount: 0,
    });
    return claim.toObject();
  }

  async update(
    id: string,
    data: Partial<Pick<IClaim, "title" | "description">>,
  ): Promise<IClaim | null> {
    return ClaimModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    ).lean<IClaim>();
  }

  async updateStatus(id: string, status: ClaimStatus): Promise<IClaim | null> {
    return ClaimModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    ).lean<IClaim>();
  }

  async updateTotalAmount(
    id: string,
    totalAmount: number,
  ): Promise<IClaim | null> {
    return ClaimModel.findByIdAndUpdate(
      id,
      { $set: { totalAmount } },
      { new: true },
    ).lean<IClaim>();
  }

  async delete(id: string): Promise<boolean> {
    const result = await ClaimModel.findByIdAndDelete(id);
    return result !== null;
  }
}
