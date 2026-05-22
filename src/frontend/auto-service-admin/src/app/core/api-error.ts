import { HttpErrorResponse } from '@angular/common/http';

export function parseApiError(err: HttpErrorResponse, fallback: string): string {
  const body = err.error;
  if (!body) {
    if (err.status === 0) return 'API недоступен. Запустите backend на http://localhost:5080';
    return fallback;
  }
  if (typeof body === 'string') return body;
  if (body.message) return body.message;
  if (body.errors) {
    const lines = Object.values(body.errors).flat() as string[];
    if (lines.length) return lines.join(' ');
  }
  if (body.title) return body.title;
  return fallback;
}
