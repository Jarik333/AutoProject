import { Client, ClientVehicleRequest } from '../../core/api.service';

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
    fullName: form.fullName,
    phone: form.phone,
    email: form.email.trim() || undefined,
    notes: form.notes.trim() || undefined,
    vehicles: toVehicleRequests(form.vehicles)
  };
}
