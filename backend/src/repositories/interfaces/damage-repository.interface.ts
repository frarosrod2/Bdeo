import { Types } from "mongoose";
import { IDamage } from "../../models/damage.model";

export interface IDamageRepository {
  findByClaimId(claimId: string): Promise<IDamage[]>;
  findById(id: string): Promise<IDamage | null>;
  create(data: {
    claimId: Types.ObjectId;
    part: string;
    severity: IDamage["severity"];
    imageUrl: string;
    price: number;
  }): Promise<IDamage>;
  update(
    id: string,
    data: Partial<
      Pick<IDamage, "part" | "severity" | "imageUrl" | "price">
    >,
  ): Promise<IDamage | null>;
  delete(id: string): Promise<boolean>;
  sumPricesByClaimId(claimId: string): Promise<number>;
}
