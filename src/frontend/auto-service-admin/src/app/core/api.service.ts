import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser } from './auth.service';

export interface ClientVehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  notes?: string;
}

export interface ClientVehicleRequest {
  id?: string;
  make: string;
  model: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  notes?: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  vehicles: ClientVehicle[];
}

export interface ClientPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  vehicles?: ClientVehicleRequest[];
}

export interface RegisterRequest {
  tenantName: string;
  slug: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl ? `${environment.apiUrl}/api` : '/api';

  register(data: RegisterRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.base}/auth/register-tenant`, data);
  }

  login(data: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.base}/auth/login`, data);
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.base}/clients`);
  }

  createClient(data: ClientPayload): Observable<Client> {
    return this.http.post<Client>(`${this.base}/clients`, data);
  }

  updateClient(id: string, data: ClientPayload): Observable<Client> {
    return this.http.put<Client>(`${this.base}/clients/${id}`, data);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/clients/${id}`);
  }
}
