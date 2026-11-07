import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showRePassword = signal(false);

  registerform: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    gender: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,16}$/)]],
    rePassword: ['', [Validators.required]]
  }, { validators: this.confirmPasswordValidator });

  confirmPasswordValidator(group: FormGroup): null | { mismatch: true } {
    const p = group.get('password')?.value;
    const rp = group.get('rePassword')?.value;
    return p === rp ? null : { mismatch: true };
  }

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleShowRePassword(): void {
    this.showRePassword.update(v => !v);
  }

  registerformsubmit(): void {
    if (this.registerform.invalid) {
      this.registerform.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formVal = { ...this.registerform.value };
    if (!formVal.username || formVal.username.trim() === '') {
      delete formVal.username;
    }

    this.authService.signup(formVal).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.error?.errors || 'Registration failed. Please check your details.');
      }
    });
  }
}
