import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClaimService } from '../../service/claim.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-claim-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './create-claim-dialog.html',
  styleUrl: './create-claim-dialog.scss',
})
export class CreateClaimDialog {
  private readonly fb = inject(FormBuilder);
  private readonly claimService = inject(ClaimService);
  private readonly dialogRef = inject(MatDialogRef<CreateClaimDialog>);
  private readonly snackBar = inject(MatSnackBar);

  saving = false;

  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.claimService
      .create({ title: this.form.value.title!, description: this.form.value.description! })
      .subscribe({
        next: (claim) => this.dialogRef.close(claim),
        error: () => {
          this.snackBar.open('Error creating claim', 'Close', { duration: 3000 });
          this.saving = false;
        },
      });
  }
}
