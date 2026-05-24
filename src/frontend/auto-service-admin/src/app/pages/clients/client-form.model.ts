import { Client, ClientVehicleRequest } from '../../core/api.service';
import {
  FieldErrors,
  optionalEmail,
  optionalMaxLength,
  optionalVin,
  optionalYear,
  requireText
} from '../../core/form-validation';

export interface VehicleFormRow {
  id?: string;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string;
  vin: string;
  notes: string;
}

export interface ClientForm {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  vehicles: VehicleFormRow[];
}

export function emptyVehicle(): VehicleFormRow {
  return { make: '', model: '', year: null, licensePlate: '', vin: '', notes: '' };
}

export function emptyClientForm(): ClientForm {
  return { fullName: '', phone: '', email: '', notes: '', vehicles: [] };
}

export function vehiclesFromClient(client: Client): VehicleFormRow[] {
  return (client.vehicles ?? []).map(v => ({
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year ?? null,
    licensePlate: v.licensePlate ?? '',
    vin: v.vin ?? '',
    notes: v.notes ?? ''
  }));
}

export function toVehicleRequests(rows: VehicleFormRow[]): ClientVehicleRequest[] {
  return rows
    .filter(v => v.make.trim() && v.model.trim())
    .map(v => ({
      id: v.id,
      make: v.make.trim(),
      model: v.model.trim(),
      year: normalizeYear(v.year),
      licensePlate: v.licensePlate.trim() || undefined,
      vin: v.vin.trim() || undefined,
      notes: v.notes.trim() || undefined
    }));
}

function normalizeYear(year: number | null | string | undefined): number | undefined {
  if (year === null || year === undefined || year === '') return undefined;
  const n = typeof year === 'number' ? year : Number(year);
  if (!Number.isFinite(n) || n < 1900 || n > 2100) return undefined;
  return n;
}

export function vehicleLabel(v: {
  make: string;
  model: string;
  year?: number | null;
  licensePlate?: string | null;
}): string {
  const parts = [v.make, v.model].filter(Boolean).join(' ');
  const year = v.year ? ` (${v.year})` : '';
  const plate = v.licensePlate ? ` · ${v.licensePlate}` : '';
  return (parts || 'Автомобиль') + year + plate;
}

export function toClientPayload(form: ClientForm) {
  return {
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || undefined,
    notes: form.notes.trim() || undefined,
    vehicles: toVehicleRequests(form.vehicles)
  };
}

export function validateClientForm(form: ClientForm): FieldErrors {
  const errors: FieldErrors = {};
  requireText(errors, 'fullName', form.fullName, 'ФИО', 200);
  requireText(errors, 'phone', form.phone, 'Телефон', 32);
  optionalEmail(errors, 'email', form.email);
  optionalMaxLength(errors, 'notes', form.notes, 'Заметки', 2000);

  form.vehicles.forEach((v, i) => {
    const base = `vehicles.${i}`;
    requireText(errors, `${base}.make`, v.make, 'Марку', 100);
    requireText(errors, `${base}.model`, v.model, 'Модель', 100);
    optionalYear(errors, `${base}.year`, v.year);
    optionalMaxLength(errors, `${base}.licensePlate`, v.licensePlate, 'Госномер', 20);
    optionalVin(errors, `${base}.vin`, v.vin);
    optionalMaxLength(errors, `${base}.notes`, v.notes, 'Заметки', 500);
  });

  return errors;
}
