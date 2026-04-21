import { Types } from "mongoose";
import { DamageModel, IDamage } from "../models/damage.model";
import { IDamageRepository } from "./interfaces/damage-repository.interface";

export class DamageRepository implements IDamageRepository {
  async findByClaimId(claimId: string): Promise<IDamage[]> {
    return DamageModel.find({ claimId })
      .sort({ createdAt: -1 })
      .lean<IDamage[]>();
  }

  async findById(id: string): Promise<IDamage | null> {
    return DamageModel.findById(id).lean<IDamage>();
  }

  async create(data: {
    claimId: Types.ObjectId;
    part: string;
    severity: IDamage["severity"];
    imageUrl: string;
    price: number;
  }): Promise<IDamage> {
    const damage = await DamageModel.create(data);
    return damage.toObject() as IDamage;
  }

  async update(
    id: string,
    data: Partial<
      Pick<IDamage, "part" | "severity" | "imageUrl" | "price">
    >,
  ): Promise<IDamage | null> {
    return DamageModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    ).lean<IDamage>();
  }

  async delete(id: string): Promise<boolean> {
    const result = await DamageModel.findByIdAndDelete(id);
    return result !== null;
  }

  async sumPricesByClaimId(claimId: string): Promise<number> {
    const result = await DamageModel.aggregate<{ total: number }>([
      { $match: { claimId: new Types.ObjectId(claimId) } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);
    return result[0]?.total ?? 0;
  }
}
