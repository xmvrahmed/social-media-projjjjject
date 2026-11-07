import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = new FormGroup({
    credential: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  loginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    const { credential, password } = this.loginForm.getRawValue();

    this.authService.login({ login: credential ?? '', password: password ?? '' }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/feed']);
      },
      error: (error: { error?: { message?: string; errors?: string } }) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || error.error?.errors || 'Login failed. Check your details and try again.');
      }
    });
  }
}
