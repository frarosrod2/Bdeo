import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { DamageResponse } from '../model/api/damage-response';
import { CreateDamageDto, Damage, UpdateDamageDto } from '../model/damage';
import { mapDamageResponse } from '../util/damage-mapper';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DamageService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/claims`;

  create(claimId: string, dto: CreateDamageDto): Observable<Damage> {
    return this.http
      .post<DamageResponse>(`${this.base}/${claimId}/damages`, dto)
      .pipe(map((damage) => mapDamageResponse(damage)));
  }

  update(claimId: string, damageId: string, dto: UpdateDamageDto): Observable<Damage> {
    return this.http
      .patch<DamageResponse>(`${this.base}/${claimId}/damages/${damageId}`, dto)
      .pipe(map((damage) => mapDamageResponse(damage)));
  }

  delete(claimId: string, damageId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${claimId}/damages/${damageId}`);
  }
}
