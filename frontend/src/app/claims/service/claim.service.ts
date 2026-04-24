import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ClaimResponse } from '../model/api/claim-response';
import { Claim, ClaimStatus, ClaimWithDamages, CreateClaimDto } from '../model/claim';
import { mapDamageResponse } from '../util/damage-mapper';
import { isClaimStatus } from '../util/is-claim-status';
import { ClaimWithDamagesResponse } from '../model/api/claim-with-damages-response';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api/claims';

  getAll(): Observable<Claim[]> {
    return this.http
      .get<ClaimResponse[]>(this.base)
      .pipe(map((claims) => claims.map((claim) => this.mapClaimResponse(claim))));
  }

  getById(id: string): Observable<ClaimWithDamages> {
    return this.http
      .get<ClaimWithDamagesResponse>(`${this.base}/${id}`)
      .pipe(map((claim) => this.mapClaimWithDamagesResponse(claim)));
  }

  create(dto: CreateClaimDto): Observable<Claim> {
    return this.http
      .post<ClaimResponse>(this.base, dto)
      .pipe(map((claim) => this.mapClaimResponse(claim)));
  }

  updateStatus(id: string, status: ClaimStatus): Observable<Claim> {
    return this.http
      .patch<ClaimResponse>(`${this.base}/${id}/status`, { status })
      .pipe(map((claim) => this.mapClaimResponse(claim)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private mapClaimResponse(claim: ClaimResponse): Claim {
    return {
      id: claim._id,
      title: claim.title,
      description: claim.description,
      status: isClaimStatus(claim.status) ? claim.status : ClaimStatus.UNKNOWN,
      totalAmount: claim.totalAmount,
      createdAt: new Date(claim.createdAt),
      updatedAt: new Date(claim.updatedAt),
    };
  }

  private mapClaimWithDamagesResponse(claim: ClaimWithDamagesResponse): ClaimWithDamages {
    return {
      id: claim._id,
      title: claim.title,
      description: claim.description,
      status: isClaimStatus(claim.status) ? claim.status : ClaimStatus.UNKNOWN,
      totalAmount: claim.totalAmount,
      createdAt: new Date(claim.createdAt),
      updatedAt: new Date(claim.updatedAt),
      damages: claim.damages.map((damage) => mapDamageResponse(damage)),
    };
  }
}
