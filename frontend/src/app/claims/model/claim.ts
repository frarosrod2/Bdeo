import { Damage } from './damage';

export enum ClaimStatus {
  PENDING = 'Pending',
  IN_REVIEW = 'InReview',
  FINISHED = 'Finished',
  UNKNOWN = 'Unknown',
}

export interface Claim {
  id: string;
  title: string;
  description: string;
  status: ClaimStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimWithDamages extends Claim {
  damages: Damage[];
}

export interface CreateClaimDto {
  title: string;
  description: string;
}
