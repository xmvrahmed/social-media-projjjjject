import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  passwordForm = new FormGroup({
    password: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,16}$/)
    ]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  get passwordsMismatch(): boolean {
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    return !!(newPassword && confirmPassword && newPassword !== confirmPassword);
  }

  submit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.passwordForm.invalid || this.passwordsMismatch) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password, newPassword } = this.passwordForm.getRawValue();
    this.isSubmitting.set(true);

    this.authService.changePassword({
      password: password ?? '',
      newPassword: newPassword ?? ''
    }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.passwordForm.reset();
        this.successMessage.set(response.message || 'Password changed successfully.');
      },
      error: (error: { error?: { message?: string; errors?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message || error.error?.errors || 'Could not change your password. Please try again.');
      }
    });
  }
}
