import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.isLoggedIn()) {
      <div class="app-layout">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <div class="sidebar-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div class="sidebar-brand-text">
              <strong>AutoService</strong>
              <span>CRM для автосервисов</span>
            </div>
          </div>

          <nav class="sidebar-nav">
            <a routerLink="/clients" routerLinkActive="active" class="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Клиенты
            </a>
            <a routerLink="/calendar" routerLinkActive="active" class="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              Календарь
            </a>
            <a routerLink="/work-orders" routerLinkActive="active" class="sidebar-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>
              </svg>
              Заказ-наряды
            </a>
          </nav>

          <div class="sidebar-footer">
            <div class="sidebar-tenant">
              <div class="sidebar-tenant-avatar">{{ tenantInitial() }}</div>
              <div class="sidebar-tenant-info">
                <strong>{{ auth.user()?.tenantName }}</strong>
                <span>{{ auth.user()?.email }}</span>
              </div>
            </div>
            <button type="button" class="sidebar-logout" (click)="logout()">Выйти</button>
          </div>
        </aside>

        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    } @else {
      <router-outlet />
    }
  `
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  tenantInitial(): string {
    const name = this.auth.user()?.tenantName ?? '';
    return name.charAt(0).toUpperCase() || 'A';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
