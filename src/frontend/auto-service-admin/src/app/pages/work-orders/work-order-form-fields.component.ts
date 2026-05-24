import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client } from '../../core/api.service';
import { FieldErrorComponent } from '../../core/field-error.component';
import { FieldErrors } from '../../core/form-validation';
import {
  formTotal,
  LINE_TYPE_OPTIONS,
  LineFormRow,
  lineTotal,
  STATUS_OPTIONS,
  vehiclesForClient,
  WorkOrderForm,
  emptyLine,
  formatMoney
} from './work-order-form.model';
import { vehicleLabel } from '../clients/client-form.model';

@Component({
  standalone: true,
  selector: 'app-work-order-form-fields',
  imports: [FormsModule, FieldErrorComponent],
  template: `
    <label>Клиент</label>
    <select
      [(ngModel)]="form.clientId"
      [ngModelOptions]="modelOpts"
      [name]="prefix + 'Client'"
      (ngModelChange)="onClientChange()"
      [class.field-invalid]="invalid('clientId')"
    >
      <option value="">Выберите клиента</option>
      @for (c of clients; track c.id) {
        <option [value]="c.id">{{ c.fullName }} · {{ c.phone }}</option>
      }
    </select>
    <app-field-error [message]="err('clientId')" />

    <label>Автомобиль</label>
    <select
      [(ngModel)]="form.clientVehicleId"
      [ngModelOptions]="modelOpts"
      [name]="prefix + 'Vehicle'"
      [disabled]="!form.clientId"
    >
      <option value="">Не указан</option>
      @for (v of availableVehicles; track v.id) {
        <option [value]="v.id">{{ vehicleLabel(v) }}</option>
      }
    </select>

    <div class="wo-form-row">
      <div>
        <label>Статус</label>
        <select [(ngModel)]="form.status" [ngModelOptions]="modelOpts" [name]="prefix + 'Status'">
          @for (s of statusOptions; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
      </div>
      <div>
        <label>Дата и время открытия</label>
        <input
          type="datetime-local"
          [(ngModel)]="form.openedAt"
          [ngModelOptions]="modelOpts"
          [name]="prefix + 'OpenedAt'"
          [class.field-invalid]="invalid('openedAt')"
        />
        <app-field-error [message]="err('openedAt')" />
      </div>
    </div>

    <label>Описание / жалоба</label>
    <textarea
      [(ngModel)]="form.description"
      [ngModelOptions]="modelOpts"
      [name]="prefix + 'Description'"
      rows="2"
      maxlength="4000"
      [class.field-invalid]="invalid('description')"
    ></textarea>
    <app-field-error [message]="err('description')" />

    <div class="lines-section">
      <div class="vehicles-section-header">
        <h3>Позиции</h3>
        <button type="button" class="secondary" (click)="addLine()">+ Добавить</button>
      </div>

      @if (form.lines.length === 0) {
        <p class="muted">Добавьте работы или запчасти.</p>
      }

      @for (line of form.lines; track trackLine($index, line); let i = $index) {
        <div class="line-block">
          <div class="vehicle-block-header">
            <span>Позиция {{ i + 1 }}</span>
            <button type="button" class="danger" (click)="removeLine(i)">Убрать</button>
          </div>
          <div class="line-grid">
            <div>
              <label>Тип</label>
              <select [(ngModel)]="line.type" [ngModelOptions]="modelOpts" [name]="prefix + 'Type' + i">
                @for (t of lineTypeOptions; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </div>
            <div class="line-grid-wide">
              <label>Наименование</label>
              <input
                [(ngModel)]="line.name"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Name' + i"
                maxlength="500"
                [class.field-invalid]="invalid(lineKey(i, 'name'))"
              />
              <app-field-error [message]="err(lineKey(i, 'name'))" />
            </div>
            <div>
              <label>Кол-во</label>
              <input
                type="number"
                [(ngModel)]="line.quantity"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Qty' + i"
                min="0.001"
                max="999999"
                step="0.001"
                [class.field-invalid]="invalid(lineKey(i, 'quantity'))"
              />
              <app-field-error [message]="err(lineKey(i, 'quantity'))" />
            </div>
            <div>
              <label>Цена</label>
              <input
                type="number"
                [(ngModel)]="line.unitPrice"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Price' + i"
                min="0"
                max="999999999"
                step="0.01"
                [class.field-invalid]="invalid(lineKey(i, 'unitPrice'))"
              />
              <app-field-error [message]="err(lineKey(i, 'unitPrice'))" />
            </div>
            <div class="line-sum">
              <span class="muted">Сумма</span>
              <strong>{{ formatMoney(lineTotal(line)) }}</strong>
            </div>
          </div>
        </div>
      }

      @if (form.lines.length > 0) {
        <p class="wo-total">Итого: <strong>{{ formatMoney(formTotal(form.lines)) }}</strong></p>
      }
    </div>
  `
})
export class WorkOrderFormFieldsComponent {
  @Input({ required: true }) form!: WorkOrderForm;
  @Input({ required: true }) prefix!: string;
  @Input({ required: true }) clients: Client[] = [];
  @Input() submitted = false;
  @Input() errors: FieldErrors = {};

  readonly modelOpts = { standalone: true };
  readonly statusOptions = STATUS_OPTIONS;
  readonly lineTypeOptions = LINE_TYPE_OPTIONS;
  readonly vehicleLabel = vehicleLabel;
  readonly lineTotal = lineTotal;
  readonly formTotal = formTotal;
  readonly formatMoney = formatMoney;

  get availableVehicles() {
    return vehiclesForClient(this.clients, this.form.clientId);
  }

  err(key: string): string | null {
    return this.submitted ? (this.errors[key] ?? null) : null;
  }

  invalid(key: string): boolean {
    return !!this.err(key);
  }

  lineKey(index: number, field: string): string {
    return `lines.${index}.${field}`;
  }

  onClientChange(): void {
    const valid = this.availableVehicles.some(v => v.id === this.form.clientVehicleId);
    if (!valid) this.form.clientVehicleId = '';
  }

  addLine(): void {
    this.form.lines.push(emptyLine());
  }

  removeLine(index: number): void {
    this.form.lines.splice(index, 1);
  }

  trackLine(index: number, line: LineFormRow): string {
    return line.id ?? `new-${index}`;
  }
}
