import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    @if (auth.isLoggedIn()) {
      <nav>
        <strong>AutoService CRM</strong>
        <a routerLink="/clients">Клиенты</a>
        <a routerLink="/calendar">Календарь</a>
        <a routerLink="/work-orders">Заказ-наряды</a>
        <span class="spacer"></span>
        <span>{{ auth.user()?.tenantName }}</span>
        <button type="button" class="secondary" (click)="logout()">Выйти</button>
      </nav>
    }
    <router-outlet />
  `
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
