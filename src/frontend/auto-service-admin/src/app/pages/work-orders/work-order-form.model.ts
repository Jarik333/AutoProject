import {
  Client,
  WorkOrder,
  WorkOrderLineRequest,
  WorkOrderLineType,
  WorkOrderPayload,
  WorkOrderStatus
} from '../../core/api.service';
import { vehicleLabel } from '../clients/client-form.model';
import {
  FieldErrors,
  optionalMaxLength,
  requireNonNegative,
  requirePositive,
  requireText
} from '../../core/form-validation';

export interface LineFormRow {
  id?: string;
  type: WorkOrderLineType;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface WorkOrderForm {
  clientId: string;
  clientVehicleId: string;
  status: WorkOrderStatus;
  openedAt: string;
  description: string;
  lines: LineFormRow[];
}

export const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'Draft', label: 'Черновик' },
  { value: 'InProgress', label: 'В работе' },
  { value: 'Done', label: 'Выполнен' },
  { value: 'Cancelled', label: 'Отменён' }
];

export const LINE_TYPE_OPTIONS: { value: WorkOrderLineType; label: string }[] = [
  { value: 'Labor', label: 'Работа' },
  { value: 'Part', label: 'Запчасть' }
];

export function emptyLine(): LineFormRow {
  return { type: 'Labor', name: '', quantity: 1, unitPrice: 0 };
}

export function emptyWorkOrderForm(): WorkOrderForm {
  return {
    clientId: '',
    clientVehicleId: '',
    status: 'Draft',
    openedAt: toDateInputValue(new Date()),
    description: '',
    lines: []
  };
}

export function formFromWorkOrder(order: WorkOrder): WorkOrderForm {
  return {
    clientId: order.clientId,
    clientVehicleId: order.clientVehicleId ?? '',
    status: order.status,
    openedAt: toDateInputValue(new Date(order.openedAt)),
    description: order.description ?? '',
    lines: (order.lines ?? []).map(l => ({
      id: l.id,
      type: l.type,
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice
    }))
  };
}

export function vehiclesForClient(clients: Client[], clientId: string) {
  const client = clients.find(c => c.id === clientId);
  return client?.vehicles ?? [];
}

export function vehicleOptionLabel(client: Client, vehicleId: string): string {
  const vehicle = client.vehicles?.find(v => v.id === vehicleId);
  return vehicle ? vehicleLabel(vehicle) : '';
}

export function lineTotal(row: LineFormRow): number {
  return (row.quantity || 0) * (row.unitPrice || 0);
}

export function formTotal(lines: LineFormRow[]): number {
  return lines.reduce((sum, row) => sum + lineTotal(row), 0);
}

export function toLineRequests(rows: LineFormRow[]): WorkOrderLineRequest[] {
  return rows
    .filter(r => r.name.trim())
    .map(r => ({
      id: r.id,
      type: r.type,
      name: r.name.trim(),
      quantity: Number(r.quantity) || 1,
      unitPrice: Number(r.unitPrice) || 0
    }));
}

export function toWorkOrderPayload(form: WorkOrderForm): WorkOrderPayload {
  return {
    clientId: form.clientId,
    clientVehicleId: form.clientVehicleId || undefined,
    status: form.status,
    openedAt: fromDateInputValue(form.openedAt),
    description: form.description.trim() || undefined,
    lines: toLineRequests(form.lines)
  };
}

export function statusLabel(status: WorkOrderStatus): string {
  return STATUS_OPTIONS.find(o => o.value === status)?.label ?? status;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2
  }).format(amount);
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromDateInputValue(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`).toISOString();
}

export function validateWorkOrderForm(form: WorkOrderForm): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.clientId) {
    errors['clientId'] = 'Выберите клиента';
  }

  if (form.openedAt) {
    const parsed = new Date(`${form.openedAt}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      errors['openedAt'] = 'Некорректная дата';
    }
  } else {
    errors['openedAt'] = 'Укажите дату открытия';
  }

  optionalMaxLength(errors, 'description', form.description, 'Описание', 4000);

  form.lines.forEach((line, i) => {
    const base = `lines.${i}`;
    requireText(errors, `${base}.name`, line.name, 'Наименование', 500);
    requirePositive(errors, `${base}.quantity`, line.quantity, 'Количество', 0.001);
    requireNonNegative(errors, `${base}.unitPrice`, line.unitPrice, 'Цена');
  });

  return errors;
}
