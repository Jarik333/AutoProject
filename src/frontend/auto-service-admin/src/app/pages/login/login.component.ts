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
      <div class="card" style="max-width: 400px; margin: 3rem auto;">
        <h1>Вход</h1>
        <form (ngSubmit)="submit()">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" name="email" required />
          <label>Пароль</label>
          <input type="password" [(ngModel)]="password" name="password" required />
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

  submit(): void {
    this.error.set('');
    this.loading.set(true);
    this.api.login({ email: this.email, password: this.password }).subscribe({
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
