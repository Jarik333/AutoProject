import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
      <h1>Заказ-наряды</h1>

      @if (errorMessage()) {
        <p class="error" style="margin-bottom: 1rem;">{{ errorMessage() }}</p>
      }

      <div class="card" style="margin-bottom: 1.5rem;">
        <h2>Новый заказ-наряд</h2>
        <form (ngSubmit)="addOrder()" novalidate>
          <app-work-order-form-fields
            [form]="createForm"
            prefix="create"
            [clients]="clients()"
            [submitted]="createSubmitted"
            [errors]="createErrors"
          />
          <button type="submit" [disabled]="saving()">Создать</button>
        </form>
      </div>

      <div class="card">
        @if (loading()) {
          <p>Загрузка...</p>
        } @else if (orders().length === 0) {
          <p>Заказ-нарядов пока нет.</p>
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
                      {{ o.openedAt | date: 'dd.MM.yyyy' }} · {{ formatMoney(o.total) }}
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
        this.orders.set(list.map(o => ({ ...o, lines: o.lines ?? [] })));
        this.loading.set(false);
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
