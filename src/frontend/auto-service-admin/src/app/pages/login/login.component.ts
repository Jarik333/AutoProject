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
    <div class="auth-layout">
      <aside class="auth-brand">
        <div class="auth-brand-inner">
          <div class="auth-brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1>AutoService CRM</h1>
          <p class="auth-brand-tagline">
            Управляйте клиентами, записями и заказ-нарядами вашего автосервиса в одном месте.
          </p>
          <ul class="auth-features">
            <li>
              <span class="auth-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </span>
              База клиентов с автомобилями
            </li>
            <li>
              <span class="auth-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/></svg>
              </span>
              Календарь записей с drag-and-drop
            </li>
            <li>
              <span class="auth-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
              </span>
              Заказ-наряды: работы и запчасти
            </li>
          </ul>
        </div>
      </aside>

      <main class="auth-form-panel">
        <div class="auth-card">
          <h2>Вход в систему</h2>
          <p class="auth-card-subtitle">Введите данные вашего аккаунта</p>

          <form (ngSubmit)="submit()" novalidate>
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              maxlength="256"
              placeholder="owner@demo.local"
              [class.field-invalid]="invalid('email')"
            />
            <app-field-error [message]="err('email')" />

            <label>Пароль</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              [class.field-invalid]="invalid('password')"
            />
            <app-field-error [message]="err('password')" />

            @if (error()) {
              <p class="error" style="margin-top: 0.75rem;">{{ error() }}</p>
            }
            <div class="form-actions" style="margin-top: 1.25rem;">
              <button type="submit" [disabled]="loading()" style="width: 100%;">
                {{ loading() ? 'Вход...' : 'Войти' }}
              </button>
            </div>
          </form>

          <p class="auth-footer-link">
            Нет аккаунта? <a routerLink="/register">Зарегистрировать автосервис</a>
          </p>
        </div>
      </main>
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
