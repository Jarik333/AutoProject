import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client } from '../../core/api.service';
import { FieldErrorComponent } from '../../core/field-error.component';
import { FieldErrors } from '../../core/form-validation';
import {
  APPOINTMENT_STATUS_OPTIONS,
  AppointmentForm,
  vehicleLabel,
  vehiclesForClient
} from './appointment-form.model';

@Component({
  standalone: true,
  selector: 'app-appointment-form-fields',
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
    </div>

    <div class="wo-form-row">
      <div>
        <label>Начало</label>
        <input
          type="datetime-local"
          [(ngModel)]="form.startsAt"
          [ngModelOptions]="modelOpts"
          [name]="prefix + 'StartsAt'"
          [class.field-invalid]="invalid('startsAt')"
        />
        <app-field-error [message]="err('startsAt')" />
      </div>
      <div>
        <label>Окончание</label>
        <input
          type="datetime-local"
          [(ngModel)]="form.endsAt"
          [ngModelOptions]="modelOpts"
          [name]="prefix + 'EndsAt'"
          [class.field-invalid]="invalid('endsAt')"
        />
        <app-field-error [message]="err('endsAt')" />
      </div>
    </div>

    <label>Заметки</label>
    <textarea
      [(ngModel)]="form.notes"
      [ngModelOptions]="modelOpts"
      [name]="prefix + 'Notes'"
      rows="2"
      maxlength="2000"
      [class.field-invalid]="invalid('notes')"
    ></textarea>
    <app-field-error [message]="err('notes')" />
  `
})
export class AppointmentFormFieldsComponent {
  @Input({ required: true }) form!: AppointmentForm;
  @Input({ required: true }) prefix!: string;
  @Input({ required: true }) clients: Client[] = [];
  @Input() submitted = false;
  @Input() errors: FieldErrors = {};

  readonly modelOpts = { standalone: true };
  readonly statusOptions = APPOINTMENT_STATUS_OPTIONS;
  readonly vehicleLabel = vehicleLabel;

  get availableVehicles() {
    return vehiclesForClient(this.clients, this.form.clientId);
  }

  err(key: string): string | null {
    return this.submitted ? (this.errors[key] ?? null) : null;
  }

  invalid(key: string): boolean {
    return !!this.err(key);
  }

  onClientChange(): void {
    const valid = this.availableVehicles.some(v => v.id === this.form.clientVehicleId);
    if (!valid) this.form.clientVehicleId = '';
  }
}
