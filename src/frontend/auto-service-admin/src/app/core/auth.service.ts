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
    return this.user() !== null;
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
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
