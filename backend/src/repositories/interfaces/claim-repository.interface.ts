import { IClaim, ClaimStatus } from "../../models/claim.model";

export interface IClaimRepository {
  findAll(): Promise<IClaim[]>;
  findById(id: string): Promise<IClaim | null>;
  create(data: { title: string; description: string }): Promise<IClaim>;
  update(
    id: string,
    data: Partial<Pick<IClaim, "title" | "description">>,
  ): Promise<IClaim | null>;
  updateStatus(id: string, status: ClaimStatus): Promise<IClaim | null>;
  updateTotalAmount(id: string, totalAmount: number): Promise<IClaim | null>;
  delete(id: string): Promise<boolean>;
}
