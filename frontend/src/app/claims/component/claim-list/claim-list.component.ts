import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Claim, ClaimStatus } from '../../model/claim';
import { ClaimService } from '../../service/claim.service';
import { CreateClaimDialog } from '../create-claim-dialog/create-claim-dialog';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-claim-list',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './claim-list.component.html',
  styleUrl: './claim-list.component.scss',
})
export class ClaimListComponent implements OnInit {
  private readonly claimService = inject(ClaimService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly claims = signal<Claim[]>([]);
  readonly loading = signal(false);
  readonly displayedColumns = ['title', 'status', 'totalAmount', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.claimService.getAll().subscribe({
      next: (data) => {
        this.claims.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error loading claims', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  openDetail(id: string): void {
    this.router.navigate(['/claims', id]);
  }

  openCreate(): void {
    const ref = this.dialog.open(CreateClaimDialog, { width: '480px' });
    ref.afterClosed().subscribe((created) => {
      if (created) this.load();
    });
  }

  deleteClaim(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm('Delete this claim and all its damages?')) return;
    this.claimService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Claim deleted', 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Error deleting claim', 'Close', { duration: 3000 }),
    });
  }

  statusColor(status: ClaimStatus): string {
    const map: Record<ClaimStatus, string> = {
      [ClaimStatus.PENDING]: 'primary',
      [ClaimStatus.IN_REVIEW]: 'accent',
      [ClaimStatus.FINISHED]: '',
      [ClaimStatus.UNKNOWN]: 'warn',
    };
    return map[status] ?? '';
  }

  statusLabel(status: ClaimStatus): string {
    const map: Record<ClaimStatus, string> = {
      [ClaimStatus.PENDING]: 'Pending',
      [ClaimStatus.IN_REVIEW]: 'In Review',
      [ClaimStatus.FINISHED]: 'Finished',
      [ClaimStatus.UNKNOWN]: 'Unknown',
    };
    return map[status] ?? status;
  }
}
