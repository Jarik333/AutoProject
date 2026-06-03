import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  token: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  email: string;
  fullName: string;
}

const STORAGE_KEY = 'autoservice_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(this.load());

  isLoggedIn(): boolean {
    const u = this.user();
    return !!u?.token && !this.isTokenExpired(u.token);
  }

  setUser(data: AuthUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    this.user.set(data);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
  }

  get token(): string | null {
    return this.user()?.token ?? null;
  }

  private load(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      if (!parsed.token || this.isTokenExpired(parsed.token)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}
