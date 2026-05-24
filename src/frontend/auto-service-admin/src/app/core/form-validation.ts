export type FieldErrors = Record<string, string>;

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireText(
  errors: FieldErrors,
  field: string,
  value: string,
  label: string,
  maxLength?: number
): void {
  const trimmed = value.trim();
  if (!trimmed) {
    errors[field] = `Укажите ${label.toLowerCase()}`;
    return;
  }
  if (maxLength !== undefined && trimmed.length > maxLength) {
    errors[field] = `${label}: не более ${maxLength} символов`;
  }
}

export function optionalMaxLength(
  errors: FieldErrors,
  field: string,
  value: string,
  label: string,
  maxLength: number
): void {
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    errors[field] = `${label}: не более ${maxLength} символов`;
  }
}

export function optionalEmail(errors: FieldErrors, field: string, value: string, maxLength = 256): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (trimmed.length > maxLength) {
    errors[field] = `Email: не более ${maxLength} символов`;
    return;
  }
  if (!EMAIL_RE.test(trimmed)) {
    errors[field] = 'Некорректный email';
  }
}

export function requireEmail(errors: FieldErrors, field: string, value: string, maxLength = 256): void {
  const trimmed = value.trim();
  if (!trimmed) {
    errors[field] = 'Укажите email';
    return;
  }
  if (trimmed.length > maxLength) {
    errors[field] = `Email: не более ${maxLength} символов`;
    return;
  }
  if (!EMAIL_RE.test(trimmed)) {
    errors[field] = 'Некорректный email';
  }
}

export function optionalYear(
  errors: FieldErrors,
  field: string,
  year: number | null | string | undefined
): void {
  if (year === null || year === undefined || year === '') return;
  const n = typeof year === 'number' ? year : Number(year);
  if (!Number.isFinite(n) || n < 1900 || n > 2100) {
    errors[field] = 'Год: от 1900 до 2100';
  }
}

export function optionalVin(errors: FieldErrors, field: string, value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (trimmed.length > 17) {
    errors[field] = 'VIN: не более 17 символов';
    return;
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(trimmed)) {
    errors[field] = 'VIN: 17 латинских букв и цифр (без I, O, Q)';
  }
}

export function requirePositive(
  errors: FieldErrors,
  field: string,
  value: number,
  label: string,
  min: number
): void {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) {
    errors[field] = `${label}: не менее ${min}`;
  }
}

export function requireNonNegative(
  errors: FieldErrors,
  field: string,
  value: number,
  label: string
): void {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    errors[field] = `${label}: не может быть отрицательным`;
  }
}

export function requirePattern(
  errors: FieldErrors,
  field: string,
  value: string,
  pattern: RegExp,
  message: string,
  maxLength?: number
): void {
  const trimmed = value.trim();
  if (!trimmed) {
    errors[field] = message;
    return;
  }
  if (maxLength !== undefined && trimmed.length > maxLength) {
    errors[field] = `Не более ${maxLength} символов`;
    return;
  }
  if (!pattern.test(trimmed)) {
    errors[field] = message;
  }
}

export function requireMinLength(
  errors: FieldErrors,
  field: string,
  value: string,
  min: number,
  label: string
): void {
  if (value.length < min) {
    errors[field] = `${label}: не менее ${min} символов`;
  }
}
