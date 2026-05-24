import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { parseApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { validateLoginForm } from '../../core/auth-form.model';
import { FieldErrorComponent } from '../../core/field-error.component';
import { FieldErrors, hasErrors } from '../../core/form-validation';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, FieldErrorComponent],
  template: `
    <div class="container">
      <div class="card" style="max-width: 400px; margin: 3rem auto;">
        <h1>Вход</h1>
        <form (ngSubmit)="submit()" novalidate>
          <label>Email</label>
          <input
            type="email"
            [(ngModel)]="email"
            name="email"
            maxlength="256"
            [class.field-invalid]="invalid('email')"
          />
          <app-field-error [message]="err('email')" />

          <label>Пароль</label>
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            [class.field-invalid]="invalid('password')"
          />
          <app-field-error [message]="err('password')" />

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button type="submit" [disabled]="loading()">Войти</button>
        </form>
        <p><a routerLink="/register">Регистрация автосервиса</a></p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);
  submitted = false;
  fieldErrors: FieldErrors = {};

  err(key: string): string | null {
    return this.submitted ? (this.fieldErrors[key] ?? null) : null;
  }

  invalid(key: string): boolean {
    return !!this.err(key);
  }

  submit(): void {
    this.submitted = true;
    this.fieldErrors = validateLoginForm({ email: this.email, password: this.password });
    if (hasErrors(this.fieldErrors)) return;

    this.error.set('');
    this.loading.set(true);
    this.api.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: user => {
        this.auth.setUser(user);
        this.router.navigate(['/clients']);
      },
      error: err => {
        this.error.set(parseApiError(err, 'Неверный email или пароль'));
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
