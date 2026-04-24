export enum Severity {
  LOW = 'low',
  MID = 'mid',
  HIGH = 'high',
  UNKNOWN = 'unknown',
}

export interface Damage {
  id: string;
  claimId: string;
  part: string;
  severity: Severity;
  imageUrl: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDamageDto {
  part: string;
  severity: Severity;
  imageUrl: string;
  price: number;
}

export interface UpdateDamageDto {
  part?: string;
  severity?: Severity;
  imageUrl?: string;
  price?: number;
}
