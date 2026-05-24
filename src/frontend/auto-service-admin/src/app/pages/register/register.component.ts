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
    <div class="container">
      <div class="card" style="max-width: 480px; margin: 2rem auto;">
        <h1>Регистрация автосервиса</h1>
        <form (ngSubmit)="submit()" novalidate>
          <label>Название сервиса</label>
          <input
            [(ngModel)]="tenantName"
            name="tenantName"
            maxlength="200"
            [class.field-invalid]="invalid('tenantName')"
          />
          <app-field-error [message]="err('tenantName')" />

          <label>Slug (латиница, для URL)</label>
          <input
            [(ngModel)]="slug"
            name="slug"
            maxlength="100"
            [class.field-invalid]="invalid('slug')"
          />
          <app-field-error [message]="err('slug')" />

          <label>Ваше имя</label>
          <input
            [(ngModel)]="fullName"
            name="fullName"
            maxlength="200"
            [class.field-invalid]="invalid('fullName')"
          />
          <app-field-error [message]="err('fullName')" />

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
          <button type="submit" [disabled]="loading()">Создать</button>
        </form>
        <p><a routerLink="/login">Уже есть аккаунт</a></p>
      </div>
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
