import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldErrorComponent } from '../../core/field-error.component';
import { FieldErrors } from '../../core/form-validation';
import { ClientForm, emptyVehicle } from './client-form.model';

@Component({
  standalone: true,
  selector: 'app-client-form-fields',
  imports: [FormsModule, FieldErrorComponent],
  template: `
    <label>ФИО</label>
    <input
      [(ngModel)]="form.fullName"
      [ngModelOptions]="modelOpts"
      [name]="prefix + 'FullName'"
      maxlength="200"
      [class.field-invalid]="invalid('fullName')"
    />
    <app-field-error [message]="err('fullName')" />

    <label>Телефон</label>
    <input
      [(ngModel)]="form.phone"
      [ngModelOptions]="modelOpts"
      [name]="prefix + 'Phone'"
      maxlength="32"
      [class.field-invalid]="invalid('phone')"
    />
    <app-field-error [message]="err('phone')" />

    <label>Email</label>
    <input
      type="email"
      [(ngModel)]="form.email"
      [ngModelOptions]="modelOpts"
      [name]="prefix + 'Email'"
      maxlength="256"
      [class.field-invalid]="invalid('email')"
    />
    <app-field-error [message]="err('email')" />

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

    <div class="vehicles-section">
      <div class="vehicles-section-header">
        <h3>Автомобили</h3>
        <button type="button" class="secondary" (click)="addVehicleRow()">+ Добавить</button>
      </div>

      @if (form.vehicles.length === 0) {
        <p class="muted">Можно добавить один или несколько автомобилей.</p>
      }

      @for (v of form.vehicles; track trackVehicle($index, v); let i = $index) {
        <div class="vehicle-block">
          <div class="vehicle-block-header">
            <span>Автомобиль {{ i + 1 }}</span>
            <button type="button" class="danger" (click)="removeVehicleRow(i)">Убрать</button>
          </div>
          <div class="vehicle-grid">
            <div>
              <label>Марка</label>
              <input
                [(ngModel)]="v.make"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Make' + i"
                maxlength="100"
                [class.field-invalid]="invalid(vehicleKey(i, 'make'))"
              />
              <app-field-error [message]="err(vehicleKey(i, 'make'))" />
            </div>
            <div>
              <label>Модель</label>
              <input
                [(ngModel)]="v.model"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Model' + i"
                maxlength="100"
                [class.field-invalid]="invalid(vehicleKey(i, 'model'))"
              />
              <app-field-error [message]="err(vehicleKey(i, 'model'))" />
            </div>
            <div>
              <label>Год</label>
              <input
                type="number"
                [(ngModel)]="v.year"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Year' + i"
                min="1900"
                max="2100"
                [class.field-invalid]="invalid(vehicleKey(i, 'year'))"
              />
              <app-field-error [message]="err(vehicleKey(i, 'year'))" />
            </div>
            <div>
              <label>Госномер</label>
              <input
                [(ngModel)]="v.licensePlate"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Plate' + i"
                maxlength="20"
                [class.field-invalid]="invalid(vehicleKey(i, 'licensePlate'))"
              />
              <app-field-error [message]="err(vehicleKey(i, 'licensePlate'))" />
            </div>
            <div class="vehicle-grid-wide">
              <label>VIN</label>
              <input
                [(ngModel)]="v.vin"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'Vin' + i"
                maxlength="17"
                [class.field-invalid]="invalid(vehicleKey(i, 'vin'))"
              />
              <app-field-error [message]="err(vehicleKey(i, 'vin'))" />
            </div>
            <div class="vehicle-grid-wide">
              <label>Заметки</label>
              <input
                [(ngModel)]="v.notes"
                [ngModelOptions]="modelOpts"
                [name]="prefix + 'VNotes' + i"
                maxlength="500"
                [class.field-invalid]="invalid(vehicleKey(i, 'notes'))"
              />
              <app-field-error [message]="err(vehicleKey(i, 'notes'))" />
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ClientFormFieldsComponent {
  @Input({ required: true }) form!: ClientForm;
  @Input({ required: true }) prefix!: string;
  @Input() submitted = false;
  @Input() errors: FieldErrors = {};

  readonly modelOpts = { standalone: true };

  err(key: string): string | null {
    return this.submitted ? (this.errors[key] ?? null) : null;
  }

  invalid(key: string): boolean {
    return !!this.err(key);
  }

  vehicleKey(index: number, field: string): string {
    return `vehicles.${index}.${field}`;
  }

  addVehicleRow(): void {
    this.form.vehicles.push(emptyVehicle());
  }

  removeVehicleRow(index: number): void {
    this.form.vehicles.splice(index, 1);
  }

  trackVehicle(index: number, v: { id?: string }): string {
    return v.id ?? `new-${index}`;
  }
}
