import { ClaimStatus } from '../model/claim';

export function isClaimStatus(value: string): value is ClaimStatus {
  return Object.values(ClaimStatus).includes(value as ClaimStatus);
}
