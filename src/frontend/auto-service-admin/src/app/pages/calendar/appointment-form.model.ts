import {
  Appointment,
  AppointmentPayload,
  AppointmentStatus,
  Client
} from '../../core/api.service';
import { vehicleLabel } from '../clients/client-form.model';
import {
  FieldErrors,
  optionalMaxLength,
  requireText
} from '../../core/form-validation';

export interface AppointmentForm {
  clientId: string;
  clientVehicleId: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  notes: string;
}

export const APPOINTMENT_STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'Scheduled', label: 'Запланирована' },
  { value: 'Confirmed', label: 'Подтверждена' },
  { value: 'Completed', label: 'Завершена' },
  { value: 'Cancelled', label: 'Отменена' }
];

export function emptyAppointmentForm(): AppointmentForm {
  const start = roundToHalfHour(new Date());
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    clientId: '',
    clientVehicleId: '',
    status: 'Scheduled',
    startsAt: toDatetimeLocalValue(start),
    endsAt: toDatetimeLocalValue(end),
    notes: ''
  };
}

export function formFromAppointment(a: Appointment): AppointmentForm {
  return {
    clientId: a.clientId,
    clientVehicleId: a.clientVehicleId ?? '',
    status: a.status,
    startsAt: toDatetimeLocalValue(new Date(a.startsAt)),
    endsAt: toDatetimeLocalValue(new Date(a.endsAt)),
    notes: a.notes ?? ''
  };
}

export function formFromRange(start: Date, end: Date): AppointmentForm {
  return {
    ...emptyAppointmentForm(),
    startsAt: toDatetimeLocalValue(start),
    endsAt: toDatetimeLocalValue(end)
  };
}

export function vehiclesForClient(clients: Client[], clientId: string) {
  const client = clients.find(c => c.id === clientId);
  return client?.vehicles ?? [];
}

export { vehicleLabel };

export function toAppointmentPayload(form: AppointmentForm): AppointmentPayload {
  return {
    clientId: form.clientId,
    clientVehicleId: form.clientVehicleId || undefined,
    status: form.status,
    startsAt: fromDatetimeLocalValue(form.startsAt),
    endsAt: fromDatetimeLocalValue(form.endsAt),
    notes: form.notes.trim() || undefined
  };
}

export function statusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status;
}

export function validateAppointmentForm(form: AppointmentForm): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.clientId) {
    errors['clientId'] = 'Выберите клиента';
  }

  const start = parseDatetimeLocal(form.startsAt);
  const end = parseDatetimeLocal(form.endsAt);

  if (!start) {
    errors['startsAt'] = 'Укажите время начала';
  }
  if (!end) {
    errors['endsAt'] = 'Укажите время окончания';
  }
  if (start && end && end <= start) {
    errors['endsAt'] = 'Окончание должно быть позже начала';
  }

  optionalMaxLength(errors, 'notes', form.notes, 'Заметки', 2000);

  return errors;
}

export function toDatetimeLocalValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

function parseDatetimeLocal(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function roundToHalfHour(date: Date): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  if (minutes < 30) {
    d.setMinutes(30, 0, 0);
  } else {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  }
  return d;
}
