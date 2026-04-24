import { DamageResponse } from './damage-response';

export interface ClaimWithDamagesResponse {
  _id: string;
  title: string;
  description: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  damages: DamageResponse[];
}
