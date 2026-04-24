import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimStatus, ClaimWithDamages } from '../../model/claim';
import { Severity } from '../../model/damage';
import { DamageForm } from '../../model/damage-form';
import { ClaimService } from '../../service/claim.service';
import { DamageService } from '../../service/damage.service';
import { isDamageSeverity } from '../../util/is-damage-severity';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-claim-detail',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatCardModule,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './claim-detail.component.html',
  styleUrl: './claim-detail.component.scss',
})
export class ClaimDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly claimService = inject(ClaimService);
  private readonly damageService = inject(DamageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly claim = signal<ClaimWithDamages | null>(null);
  readonly loading = signal(false);
  readonly savingDamage = signal(false);
  readonly showAddForm = signal(false);

  readonly isPending = computed(() => this.claim()?.status === 'Pending');
  readonly totalAmount = computed(() => this.claim()?.totalAmount ?? 0);

  readonly displayedColumns = ['part', 'severity', 'imageUrl', 'price', 'actions'];

  readonly nextStatuses = computed<ClaimStatus[]>(() => {
    const status = this.claim()?.status;
    const map: Record<ClaimStatus, ClaimStatus[]> = {
      [ClaimStatus.PENDING]: [ClaimStatus.IN_REVIEW],
      [ClaimStatus.IN_REVIEW]: [ClaimStatus.PENDING, ClaimStatus.FINISHED],
      [ClaimStatus.FINISHED]: [],
      [ClaimStatus.UNKNOWN]: [],
    };
    return status ? map[status] : [];
  });

  damageForm = this.fb.group<DamageForm>({
    part: this.fb.nonNullable.control('', Validators.required),
    severity: this.fb.nonNullable.control('', Validators.required),
    imageUrl: this.fb.nonNullable.control('', Validators.required),
    price: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
  });

  private get claimId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.claimService.getById(this.claimId).subscribe({
      next: (data) => {
        this.claim.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Claim not found', 'Close', { duration: 3000 });
        this.loading.set(false);
        this.router.navigate(['/claims']);
      },
    });
  }

  addDamage(): void {
    if (this.damageForm.invalid) {
      this.damageForm.markAllAsTouched();
      return;
    }
    this.savingDamage.set(true);
    const damageFormValue = this.damageForm.getRawValue();
    this.damageService
      .create(this.claimId, {
        part: damageFormValue.part,
        severity: isDamageSeverity(damageFormValue.severity)
          ? damageFormValue.severity
          : Severity.UNKNOWN,
        imageUrl: damageFormValue.imageUrl,
        price: damageFormValue.price,
      })
      .subscribe({
        next: () => {
          this.damageForm.reset();
          this.showAddForm.set(false);
          this.savingDamage.set(false);
          this.load();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error adding damage';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
          this.savingDamage.set(false);
        },
      });
  }

  deleteDamage(damageId: string): void {
    if (!confirm('Delete this damage?')) return;
    this.damageService.delete(this.claimId, damageId).subscribe({
      next: () => {
        this.snackBar.open('Damage deleted', 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Error deleting damage', 'Close', { duration: 3000 }),
    });
  }

  changeStatus(status: ClaimStatus): void {
    this.claimService.updateStatus(this.claimId, status).subscribe({
      next: () => {
        this.snackBar.open('Status updated', 'Close', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error updating status';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/claims']);
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

  statusColor(status: ClaimStatus): string {
    const map: Record<ClaimStatus, string> = {
      [ClaimStatus.PENDING]: 'primary',
      [ClaimStatus.IN_REVIEW]: 'accent',
      [ClaimStatus.FINISHED]: '',
      [ClaimStatus.UNKNOWN]: 'warn',
    };
    return map[status] ?? '';
  }

  severityColor(severity: Severity): string {
    const map: Record<Severity, string> = {
      [Severity.LOW]: '',
      [Severity.MID]: 'accent',
      [Severity.HIGH]: 'warn',
      [Severity.UNKNOWN]: 'warn',
    };
    return map[severity] ?? '';
  }

  cancelAddForm(): void {
    this.damageForm.reset();
    this.showAddForm.set(false);
  }
}
