import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { parseApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card" style="max-width: 480px; margin: 2rem auto;">
        <h1>Регистрация автосервиса</h1>
        <form (ngSubmit)="submit()">
          <label>Название сервиса</label>
          <input [(ngModel)]="tenantName" name="tenantName" required />
          <label>Slug (латиница, для URL)</label>
          <input [(ngModel)]="slug" name="slug" required pattern="[a-z0-9-]+" />
          <label>Ваше имя</label>
          <input [(ngModel)]="fullName" name="fullName" required />
          <label>Email</label>
          <input type="email" [(ngModel)]="email" name="email" required />
          <label>Пароль</label>
          <input type="password" [(ngModel)]="password" name="password" required minlength="6" />
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

  submit(): void {
    this.error.set('');
    this.loading.set(true);
    this.api.register({
      tenantName: this.tenantName,
      slug: this.slug.toLowerCase().trim(),
      email: this.email,
      password: this.password,
      fullName: this.fullName
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
