import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientForm, emptyVehicle } from './client-form.model';

@Component({
  standalone: true,
  selector: 'app-client-form-fields',
  imports: [FormsModule],
  template: `
    <label>ФИО</label>
    <input [(ngModel)]="form.fullName" [ngModelOptions]="modelOpts" [name]="prefix + 'FullName'" required />

    <label>Телефон</label>
    <input [(ngModel)]="form.phone" [ngModelOptions]="modelOpts" [name]="prefix + 'Phone'" required />

    <label>Email</label>
    <input type="email" [(ngModel)]="form.email" [ngModelOptions]="modelOpts" [name]="prefix + 'Email'" />

    <label>Заметки</label>
    <textarea [(ngModel)]="form.notes" [ngModelOptions]="modelOpts" [name]="prefix + 'Notes'" rows="2"></textarea>

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
              <input [(ngModel)]="v.make" [ngModelOptions]="modelOpts" [name]="prefix + 'Make' + i" required />
            </div>
            <div>
              <label>Модель</label>
              <input [(ngModel)]="v.model" [ngModelOptions]="modelOpts" [name]="prefix + 'Model' + i" required />
            </div>
            <div>
              <label>Год</label>
              <input type="number" [(ngModel)]="v.year" [ngModelOptions]="modelOpts" [name]="prefix + 'Year' + i" min="1900" max="2100" />
            </div>
            <div>
              <label>Госномер</label>
              <input [(ngModel)]="v.licensePlate" [ngModelOptions]="modelOpts" [name]="prefix + 'Plate' + i" />
            </div>
            <div class="vehicle-grid-wide">
              <label>VIN</label>
              <input [(ngModel)]="v.vin" [ngModelOptions]="modelOpts" [name]="prefix + 'Vin' + i" maxlength="17" />
            </div>
            <div class="vehicle-grid-wide">
              <label>Заметки</label>
              <input [(ngModel)]="v.notes" [ngModelOptions]="modelOpts" [name]="prefix + 'VNotes' + i" />
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

  readonly modelOpts = { standalone: true };

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
