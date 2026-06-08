import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Client, WorkOrder } from '../../core/api.service';
import { parseApiError } from '../../core/api-error';
import { WorkOrderFormFieldsComponent } from './work-order-form-fields.component';
import { FieldErrors, hasErrors } from '../../core/form-validation';
import {
  emptyWorkOrderForm,
  formFromWorkOrder,
  formatMoney,
  statusLabel,
  toWorkOrderPayload,
  validateWorkOrderForm,
  WorkOrderForm
} from './work-order-form.model';

@Component({
  standalone: true,
  imports: [FormsModule, DatePipe, WorkOrderFormFieldsComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Заказ-наряды</h1>
          <p class="page-subtitle">Работы, запчасти и статусы выполнения</p>
        </div>
        @if (!loading()) {
          <div class="page-stats">
            <div class="stat-pill">
              <span class="stat-pill-value">{{ orders().length }}</span>
              <span class="stat-pill-label">Всего</span>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-value">{{ activeCount() }}</span>
              <span class="stat-pill-label">В работе</span>
            </div>
          </div>
        }
      </header>

      @if (errorMessage()) {
        <div class="alert-error">{{ errorMessage() }}</div>
      }

      <div class="card section-card">
        <div class="section-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
          <h2>Новый заказ-наряд</h2>
        </div>
        <form (ngSubmit)="addOrder()" novalidate>
          <app-work-order-form-fields
            [form]="createForm"
            prefix="create"
            [clients]="clients()"
            [submitted]="createSubmitted"
            [errors]="createErrors"
          />
          <div class="form-actions form-submit">
            <button type="submit" [disabled]="saving()">{{ saving() ? 'Создание...' : 'Создать заказ-наряд' }}</button>
          </div>
        </form>
      </div>

      <div class="card">
        @if (loading()) {
          <div class="skeleton-list">
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton-card"></div>
            }
          </div>
        } @else if (orders().length === 0) {
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
            </div>
            <p>Заказ-нарядов пока нет. Создайте первый или сформируйте из записи в календаре.</p>
          </div>
        } @else {
          <div class="client-list">
            @for (o of orders(); track o.id) {
              <article
                class="client-card wo-card"
                [class.selected]="selectedId() === o.id"
                (click)="selectOrder(o)"
              >
                <header class="client-card-header">
                  <div>
                    <strong>{{ o.displayNumber }}</strong>
                    <span class="status-badge" [attr.data-status]="o.status">{{ statusLabel(o.status) }}</span>
                    <div class="client-meta">
                      {{ o.clientName }}
                      @if (o.vehicleLabel) {
                        · {{ o.vehicleLabel }}
                      }
                    </div>
                    <div class="client-meta muted">
                      {{ o.openedAt | date: 'dd.MM.yyyy HH:mm' }} · {{ formatMoney(o.total) }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="danger"
                    (click)="remove(o.id); $event.stopPropagation()"
                  >
                    Удалить
                  </button>
                </header>

                @if (o.lines.length > 0) {
                  <table class="wo-lines-preview">
                    <thead>
                      <tr>
                        <th>Позиция</th>
                        <th>Кол-во</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (line of o.lines; track line.id) {
                        <tr>
                          <td>{{ line.name }}</td>
                          <td>{{ line.quantity }}</td>
                          <td>{{ formatMoney(line.lineTotal) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }

                @if (selectedId() === o.id && editForm) {
                  <form class="client-edit" (ngSubmit)="saveOrder()" (click)="$event.stopPropagation()" novalidate>
                    <h3>Редактирование</h3>
                    <app-work-order-form-fields
                      [form]="editForm"
                      prefix="edit"
                      [clients]="clients()"
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
export class WorkOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly orders = signal<WorkOrder[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  createForm: WorkOrderForm = emptyWorkOrderForm();
  editForm: WorkOrderForm | null = null;
  createSubmitted = false;
  createErrors: FieldErrors = {};
  editSubmitted = false;
  editErrors: FieldErrors = {};

  readonly statusLabel = statusLabel;
  readonly formatMoney = formatMoney;

  activeCount(): number {
    return this.orders().filter(o => o.status === 'InProgress' || o.status === 'Draft').length;
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadOrders();
  }

  loadClients(): void {
    this.api.getClients().subscribe({
      next: list => this.clients.set(list.map(c => ({ ...c, vehicles: c.vehicles ?? [] }))),
      error: err =>
        this.errorMessage.set(this.formatError(err, 'Не удалось загрузить клиентов'))
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.api.getWorkOrders().subscribe({
      next: list => {
        const orders = list.map(o => ({ ...o, lines: o.lines ?? [] }));
        this.orders.set(orders);
        this.loading.set(false);
        const selected = this.route.snapshot.queryParamMap.get('selected');
        if (selected) {
          const order = orders.find(o => o.id === selected);
          if (order) this.selectOrder(order);
        }
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось загрузить заказ-наряды'));
      }
    });
  }

  selectOrder(order: WorkOrder): void {
    if (this.selectedId() === order.id) {
      this.cancelEdit();
      return;
    }
    this.selectedId.set(order.id);
    this.editSubmitted = false;
    this.editErrors = {};
    this.editForm = formFromWorkOrder(order);
  }

  cancelEdit(): void {
    this.selectedId.set(null);
    this.editForm = null;
    this.editSubmitted = false;
    this.editErrors = {};
  }

  addOrder(): void {
    this.createSubmitted = true;
    this.createErrors = validateWorkOrderForm(this.createForm);
    if (hasErrors(this.createErrors)) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.api.createWorkOrder(toWorkOrderPayload(this.createForm)).subscribe({
      next: order => {
        this.orders.update(list => [{ ...order, lines: order.lines ?? [] }, ...list]);
        this.createForm = emptyWorkOrderForm();
        this.createSubmitted = false;
        this.createErrors = {};
        this.saving.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось создать заказ-наряд'));
      }
    });
  }

  saveOrder(): void {
    const id = this.selectedId();
    if (!id || !this.editForm) return;

    this.editSubmitted = true;
    this.editErrors = validateWorkOrderForm(this.editForm);
    if (hasErrors(this.editErrors)) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.api.updateWorkOrder(id, toWorkOrderPayload(this.editForm)).subscribe({
      next: order => {
        this.orders.update(list =>
          list.map(o => (o.id === order.id ? { ...order, lines: order.lines ?? [] } : o))
        );
        this.cancelEdit();
        this.saving.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось сохранить заказ-наряд'));
      }
    });
  }

  remove(id: string): void {
    if (!confirm('Удалить заказ-наряд?')) return;
    this.api.deleteWorkOrder(id).subscribe({
      next: () => {
        if (this.selectedId() === id) this.cancelEdit();
        this.orders.update(list => list.filter(o => o.id !== id));
      },
      error: err => this.errorMessage.set(this.formatError(err, 'Не удалось удалить заказ-наряд'))
    });
  }

  private formatError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) return parseApiError(err, fallback);
    return fallback;
  }
}
