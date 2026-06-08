import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { parseApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { validateRegisterForm } from '../../core/auth-form.model';
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
          <h1>Начните бесплатно</h1>
          <p class="auth-brand-tagline">
            Создайте аккаунт автосервиса за минуту. Мультитенантность, изоляция данных, готовые модули CRM.
          </p>
          <ul class="auth-features">
            <li>
              <span class="auth-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              Изолированные данные для каждого сервиса
            </li>
            <li>
              <span class="auth-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </span>
              Готов к работе сразу после регистрации
            </li>
          </ul>
        </div>
      </aside>

      <main class="auth-form-panel">
        <div class="auth-card">
          <h2>Регистрация автосервиса</h2>
          <p class="auth-card-subtitle">Заполните данные вашего сервиса</p>

          <form (ngSubmit)="submit()" novalidate>
            <label>Название сервиса</label>
            <input
              [(ngModel)]="tenantName"
              name="tenantName"
              maxlength="200"
              placeholder="Мой автосервис"
              [class.field-invalid]="invalid('tenantName')"
            />
            <app-field-error [message]="err('tenantName')" />

            <label>Slug (латиница, для URL)</label>
            <input
              [(ngModel)]="slug"
              name="slug"
              maxlength="100"
              placeholder="my-garage"
              [class.field-invalid]="invalid('slug')"
            />
            <app-field-error [message]="err('slug')" />

            <label>Ваше имя</label>
            <input
              [(ngModel)]="fullName"
              name="fullName"
              maxlength="200"
              placeholder="Иван Иванов"
              [class.field-invalid]="invalid('fullName')"
            />
            <app-field-error [message]="err('fullName')" />

            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              maxlength="256"
              placeholder="owner@garage.local"
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
                {{ loading() ? 'Создание...' : 'Создать аккаунт' }}
              </button>
            </div>
          </form>

          <p class="auth-footer-link">
            Уже есть аккаунт? <a routerLink="/login">Войти</a>
          </p>
        </div>
      </main>
    </div>
  `
})
export class RegisterComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  tenantName = '';
  slug = '';
  fullName = '';
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
    this.fieldErrors = validateRegisterForm({
      tenantName: this.tenantName,
      slug: this.slug,
      fullName: this.fullName,
      email: this.email,
      password: this.password
    });
    if (hasErrors(this.fieldErrors)) return;

    this.error.set('');
    this.loading.set(true);
    this.api.register({
      tenantName: this.tenantName.trim(),
      slug: this.slug.toLowerCase().trim(),
      email: this.email.trim(),
      password: this.password,
      fullName: this.fullName.trim()
    }).subscribe({
      next: user => {
        this.auth.setUser(user);
        this.router.navigate(['/clients']);
      },
      error: err => {
        this.error.set(parseApiError(err, 'Не удалось зарегистрировать'));
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
