import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Client } from '../../core/api.service';
import { ClientFormFieldsComponent } from './client-form-fields.component';
import { FieldErrors, hasErrors } from '../../core/form-validation';
import {
  ClientForm,
  emptyClientForm,
  toClientPayload,
  validateClientForm,
  vehicleLabel,
  vehiclesFromClient
} from './client-form.model';

@Component({
  standalone: true,
  imports: [FormsModule, ClientFormFieldsComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Клиенты</h1>
          <p class="page-subtitle">База клиентов и их автомобилей</p>
        </div>
        @if (!loading()) {
          <div class="page-stats">
            <div class="stat-pill">
              <span class="stat-pill-value">{{ clients().length }}</span>
              <span class="stat-pill-label">Клиентов</span>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-value">{{ vehicleCount() }}</span>
              <span class="stat-pill-label">Авто</span>
            </div>
          </div>
        }
      </header>

      @if (errorMessage()) {
        <div class="alert-error">{{ errorMessage() }}</div>
      }

      <div class="card section-card">
        <div class="section-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          <h2>Новый клиент</h2>
        </div>
        <form (ngSubmit)="addClient()" novalidate>
          <app-client-form-fields
            [form]="createForm"
            prefix="create"
            [submitted]="createSubmitted"
            [errors]="createErrors"
          />
          <button type="submit" [disabled]="saving()">{{ saving() ? 'Сохранение...' : 'Добавить клиента' }}</button>
        </form>
      </div>

      <div class="card">
        @if (loading()) {
          <div class="skeleton-list">
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton-card"></div>
            }
          </div>
        } @else if (clients().length === 0) {
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <p>Клиентов пока нет. Добавьте первого клиента выше.</p>
          </div>
        } @else {
          <div class="client-list">
            @for (c of clients(); track c.id) {
              <article
                class="client-card"
                [class.selected]="selectedId() === c.id"
                (click)="selectClient(c)"
              >
                <header class="client-card-header">
                  <div>
                    <strong>{{ c.fullName }}</strong>
                    <div class="client-meta">{{ c.phone }} · {{ c.email ?? 'без email' }}</div>
                  </div>
                  <button
                    type="button"
                    class="danger"
                    (click)="remove(c.id); $event.stopPropagation()"
                  >
                    Удалить
                  </button>
                </header>
                @if (c.vehicles.length > 0) {
                  <ul class="vehicle-chips">
                    @for (v of c.vehicles; track v.id) {
                      <li>{{ vehicleLabel(v) }}</li>
                    }
                  </ul>
                } @else {
                  <p class="muted">Автомобили не указаны</p>
                }

                @if (selectedId() === c.id && editForm) {
                  <form class="client-edit" (ngSubmit)="saveClient()" (click)="$event.stopPropagation()" novalidate>
                    <h3>Редактирование</h3>
                    <app-client-form-fields
                      [form]="editForm"
                      prefix="edit"
                      [submitted]="editSubmitted"
                      [errors]="editErrors"
                    />
                    <div class="form-actions">
                      <button type="submit" [disabled]="saving()">Сохранить</button>
                      <button type="button" class="secondary" (click)="cancelEdit()">Отмена</button>
                    </div>
                  </form>
                }
              </article>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ClientsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  createForm: ClientForm = emptyClientForm();
  editForm: ClientForm | null = null;
  createSubmitted = false;
  createErrors: FieldErrors = {};
  editSubmitted = false;
  editErrors: FieldErrors = {};

  readonly vehicleLabel = vehicleLabel;

  vehicleCount(): number {
    return this.clients().reduce((sum, c) => sum + c.vehicles.length, 0);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getClients().subscribe({
      next: list => {
        this.clients.set(list.map(c => ({ ...c, vehicles: c.vehicles ?? [] })));
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось загрузить клиентов'));
      }
    });
  }

  selectClient(client: Client): void {
    if (this.selectedId() === client.id) {
      this.cancelEdit();
      return;
    }
    this.selectedId.set(client.id);
    this.editSubmitted = false;
    this.editErrors = {};
    this.editForm = {
      fullName: client.fullName,
      phone: client.phone,
      email: client.email ?? '',
      notes: client.notes ?? '',
      vehicles: vehiclesFromClient(client)
    };
  }

  cancelEdit(): void {
    this.selectedId.set(null);
    this.editForm = null;
    this.editSubmitted = false;
    this.editErrors = {};
  }

  addClient(): void {
    this.createSubmitted = true;
    this.createErrors = validateClientForm(this.createForm);
    if (hasErrors(this.createErrors)) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.api.createClient(toClientPayload(this.createForm)).subscribe({
      next: client => {
        this.clients.update(list => [{ ...client, vehicles: client.vehicles ?? [] }, ...list]);
        this.createForm = emptyClientForm();
        this.createSubmitted = false;
        this.createErrors = {};
        this.saving.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось создать клиента'));
      }
    });
  }

  saveClient(): void {
    const id = this.selectedId();
    if (!id || !this.editForm) return;

    this.editSubmitted = true;
    this.editErrors = validateClientForm(this.editForm);
    if (hasErrors(this.editErrors)) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.api.updateClient(id, toClientPayload(this.editForm)).subscribe({
      next: client => {
        this.clients.update(list =>
          list.map(c => (c.id === client.id ? { ...client, vehicles: client.vehicles ?? [] } : c))
        );
        this.cancelEdit();
        this.saving.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось сохранить клиента'));
      }
    });
  }

  remove(id: string): void {
    if (!confirm('Удалить клиента?')) return;
    this.api.deleteClient(id).subscribe({
      next: () => {
        if (this.selectedId() === id) this.cancelEdit();
        this.clients.update(list => list.filter(c => c.id !== id));
      },
      error: err => this.errorMessage.set(this.formatError(err, 'Не удалось удалить клиента'))
    });
  }

  private formatError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string; errors?: Record<string, string[]> } | null;
      if (body?.errors) {
        const details = Object.values(body.errors).flat().join(' ');
        if (details) return `${body.message ?? fallback}: ${details}`;
      }
      if (body?.message) return body.message;
      if (err.status === 0) return 'Нет связи с сервером. Запущен ли API?';
      if (err.status >= 500) return `${fallback} (ошибка сервера)`;
      return fallback;
    }
    return fallback;
  }
}
