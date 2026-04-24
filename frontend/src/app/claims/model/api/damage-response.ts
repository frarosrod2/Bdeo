export interface DamageResponse {
  _id: string;
  claimId: string;
  part: string;
  severity: string;
  imageUrl: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}