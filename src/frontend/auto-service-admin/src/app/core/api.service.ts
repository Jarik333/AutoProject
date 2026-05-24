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

export type WorkOrderStatus = 'Draft' | 'InProgress' | 'Done' | 'Cancelled';
export type WorkOrderLineType = 'Labor' | 'Part';

export interface WorkOrderLine {
  id: string;
  type: WorkOrderLineType;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface WorkOrderLineRequest {
  id?: string;
  type: WorkOrderLineType;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface WorkOrder {
  id: string;
  number: number;
  displayNumber: string;
  clientId: string;
  clientName: string;
  clientVehicleId?: string;
  vehicleLabel?: string;
  status: WorkOrderStatus;
  openedAt: string;
  closedAt?: string;
  description?: string;
  createdAt: string;
  total: number;
  lines: WorkOrderLine[];
}

export interface WorkOrderPayload {
  clientId: string;
  clientVehicleId?: string;
  status: WorkOrderStatus;
  openedAt?: string;
  description?: string;
  lines?: WorkOrderLineRequest[];
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientVehicleId?: string;
  vehicleLabel?: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  notes?: string;
  workOrderId?: string;
  workOrderDisplayNumber?: string;
  createdAt: string;
}

export interface AppointmentPayload {
  clientId: string;
  clientVehicleId?: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  notes?: string;
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

  getWorkOrders(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(`${this.base}/workorders`);
  }

  createWorkOrder(data: WorkOrderPayload): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.base}/workorders`, data);
  }

  updateWorkOrder(id: string, data: WorkOrderPayload): Observable<WorkOrder> {
    return this.http.put<WorkOrder>(`${this.base}/workorders/${id}`, data);
  }

  deleteWorkOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/workorders/${id}`);
  }

  getAppointments(from: string, to: string): Observable<Appointment[]> {
    const params = { from, to };
    return this.http.get<Appointment[]>(`${this.base}/appointments`, { params });
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.base}/appointments/${id}`);
  }

  createAppointment(data: AppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/appointments`, data);
  }

  updateAppointment(id: string, data: AppointmentPayload): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.base}/appointments/${id}`, data);
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/appointments/${id}`);
  }

  createWorkOrderFromAppointment(id: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/appointments/${id}/work-order`, {});
  }
}
