import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'claims', pathMatch: 'full' },
  {
    path: 'claims',
    loadComponent: () =>
      import('./claims/component/claim-list/claim-list.component').then(
        (m) => m.ClaimListComponent,
      ),
  },
  {
    path: 'claims/:id',
    loadComponent: () =>
      import('./claims/component/claim-detail/claim-detail.component').then(
        (m) => m.ClaimDetailComponent,
      ),
  },
];
