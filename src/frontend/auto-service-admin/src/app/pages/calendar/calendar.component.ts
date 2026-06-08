import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarOptions,
  DateSelectArg,
  EventChangeArg,
  EventClickArg,
  EventInput
} from '@fullcalendar/core';
import ruLocale from '@fullcalendar/core/locales/ru';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ApiService, Appointment, Client } from '../../core/api.service';
import { parseApiError } from '../../core/api-error';
import { FieldErrors, hasErrors } from '../../core/form-validation';
import { AppointmentFormFieldsComponent } from './appointment-form-fields.component';
import {
  AppointmentForm,
  emptyAppointmentForm,
  formFromAppointment,
  formFromRange,
  statusLabel,
  toAppointmentPayload,
  validateAppointmentForm
} from './appointment-form.model';

@Component({
  standalone: true,
  imports: [FullCalendarModule, FormsModule, RouterLink, AppointmentFormFieldsComponent],
  template: `
    <div class="container container-wide">
      <header class="page-header calendar-toolbar">
        <div>
          <h1>Календарь записей</h1>
          <p class="page-subtitle">Планирование визитов и привязка к заказ-нарядам</p>
        </div>
        <button type="button" (click)="openCreateFromPlus()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Новая запись
        </button>
      </header>

      @if (errorMessage()) {
        <div class="alert-error">{{ errorMessage() }}</div>
      }

      <div class="card calendar-card">
        @if (loading()) {
          <div class="skeleton-list" style="margin-bottom: 0.75rem;">
            <div class="skeleton-card" style="height: 400px;"></div>
          </div>
        }
        <full-calendar [options]="calendarOptions()" />
      </div>

      @if (panelOpen()) {
        <div class="calendar-overlay" (click)="closePanel()"></div>
        <div class="calendar-panel card" (click)="$event.stopPropagation()">
          <header class="calendar-panel-header">
            <h2>{{ editingId() ? 'Редактирование записи' : 'Новая запись' }}</h2>
            <button type="button" class="secondary" (click)="closePanel()">Закрыть</button>
          </header>

          <form (ngSubmit)="save()" novalidate>
            <app-appointment-form-fields
              [form]="form"
              prefix="appt"
              [clients]="clients()"
              [submitted]="submitted"
              [errors]="errors"
            />

            @if (editingId() && currentAppointment()?.workOrderId) {
              <p class="wo-link muted">
                Заказ-наряд:
                <a [routerLink]="['/work-orders']" [queryParams]="{ selected: currentAppointment()!.workOrderId }">
                  {{ currentAppointment()!.workOrderDisplayNumber }}
                </a>
              </p>
            }

            <div class="form-actions form-actions-stack">
              <button type="submit" [disabled]="saving()">Сохранить</button>
              @if (!currentAppointment()?.workOrderId) {
                <button
                  type="button"
                  class="secondary"
                  [disabled]="saving()"
                  (click)="saveAndCreateWorkOrder()"
                >
                  Сохранить и создать заказ-наряд
                </button>
              }
              @if (editingId() && !currentAppointment()?.workOrderId) {
                <div class="wo-from-appt">
                  <button type="button" [disabled]="saving()" (click)="createWorkOrder()">
                    Сформировать заказ-наряд
                  </button>
                  <p class="muted wo-from-appt-hint">
                    Дата и время из записи переносятся в заказ-наряд
                  </p>
                </div>
              }
              @if (editingId()) {
                <button type="button" class="danger" [disabled]="saving()" (click)="remove()">
                  Удалить
                </button>
              }
              <button type="button" class="secondary" (click)="closePanel()">Отмена</button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class CalendarComponent implements OnInit {
  @ViewChild(FullCalendarComponent) private calendarRef?: FullCalendarComponent;

  private readonly api = inject(ApiService);

  readonly clients = signal<Client[]>([]);
  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly panelOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly calendarOptions = signal<CalendarOptions>(this.buildOptions());

  form: AppointmentForm = emptyAppointmentForm();
  submitted = false;
  errors: FieldErrors = {};

  private rangeFrom: Date | null = null;
  private rangeTo: Date | null = null;

  readonly statusLabel = statusLabel;

  ngOnInit(): void {
    this.loadClients();
  }

  openCreateFromPlus(): void {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    this.openCreatePanel(start, end);
  }

  currentAppointment(): Appointment | undefined {
    const id = this.editingId();
    if (!id) return undefined;
    return this.appointments().find(a => a.id === id);
  }

  private loadClients(): void {
    this.api.getClients().subscribe({
      next: list => this.clients.set(list.map(c => ({ ...c, vehicles: c.vehicles ?? [] }))),
      error: err =>
        this.errorMessage.set(this.formatError(err, 'Не удалось загрузить клиентов'))
    });
  }

  private loadAppointments(): void {
    if (!this.rangeFrom || !this.rangeTo) return;

    this.loading.set(true);
    this.api.getAppointments(this.rangeFrom.toISOString(), this.rangeTo.toISOString()).subscribe({
      next: list => {
        this.appointments.set(list);
        this.applyEvents(list);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось загрузить записи'));
      }
    });
  }

  private applyEvents(list: Appointment[]): void {
    this.calendarOptions.update(opts => ({
      ...opts,
      events: list.map(a => this.toCalendarEvent(a))
    }));
  }

  private buildOptions(): CalendarOptions {
    return {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      locale: ruLocale,
      firstDay: 1,
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
      allDaySlot: false,
      height: 'auto',
      editable: true,
      selectable: true,
      selectMirror: true,
      nowIndicator: true,
      events: [],
      datesSet: info => {
        this.rangeFrom = info.start;
        this.rangeTo = info.end;
        this.loadAppointments();
      },
      select: info => this.onSelect(info),
      eventClick: info => this.onEventClick(info),
      eventDrop: info => this.onEventChange(info),
      eventResize: info => this.onEventChange(info)
    };
  }

  private onSelect(info: DateSelectArg): void {
    this.openCreatePanel(info.start, info.end);
    this.calendarRef?.getApi().unselect();
  }

  private onEventClick(info: EventClickArg): void {
    const appt = this.appointments().find(a => a.id === info.event.id);
    if (!appt) return;
    this.openEditPanel(appt);
  }

  private onEventChange(info: EventChangeArg): void {
    const appt = this.appointments().find(a => a.id === info.event.id);
    if (!appt || !info.event.start) {
      info.revert();
      return;
    }

    const end = info.event.end ?? new Date(info.event.start.getTime() + 60 * 60 * 1000);
    const payload = {
      ...toAppointmentPayload(formFromAppointment(appt)),
      startsAt: info.event.start.toISOString(),
      endsAt: end.toISOString()
    };

    this.api.updateAppointment(appt.id, payload).subscribe({
      next: updated => this.replaceAppointment(updated),
      error: err => {
        info.revert();
        this.errorMessage.set(this.formatError(err, 'Не удалось перенести запись'));
      }
    });
  }

  private openCreatePanel(start: Date, end: Date): void {
    this.editingId.set(null);
    this.form = formFromRange(start, end);
    this.submitted = false;
    this.errors = {};
    this.panelOpen.set(true);
    this.errorMessage.set(null);
  }

  private openEditPanel(appt: Appointment): void {
    this.editingId.set(appt.id);
    this.form = formFromAppointment(appt);
    this.submitted = false;
    this.errors = {};
    this.panelOpen.set(true);
    this.errorMessage.set(null);
  }

  private applySavedAppointment(appt: Appointment, isNew: boolean): void {
    if (isNew) {
      this.appointments.update(list => [...list, appt]);
    } else {
      this.replaceAppointment(appt);
    }
    this.editingId.set(appt.id);
    this.form = formFromAppointment(appt);
    this.submitted = false;
    this.errors = {};
    this.applyEvents(this.appointments());
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.editingId.set(null);
    this.submitted = false;
    this.errors = {};
  }

  save(): void {
    this.persistAppointment(false);
  }

  saveAndCreateWorkOrder(): void {
    this.persistAppointment(true);
  }

  private persistAppointment(andCreateWorkOrder: boolean): void {
    this.submitted = true;
    this.errors = validateAppointmentForm(this.form);
    if (hasErrors(this.errors)) return;

    const payload = toAppointmentPayload(this.form);
    const id = this.editingId();
    const isNew = !id;

    this.saving.set(true);
    this.errorMessage.set(null);

    const request = id
      ? this.api.updateAppointment(id, payload)
      : this.api.createAppointment(payload);

    request.subscribe({
      next: appt => {
        this.applySavedAppointment(appt, isNew);
        this.saving.set(false);

        if (andCreateWorkOrder && !appt.workOrderId) {
          this.createWorkOrder();
        }
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(
          this.formatError(err, id ? 'Не удалось сохранить запись' : 'Не удалось создать запись')
        );
      }
    });
  }

  remove(): void {
    const id = this.editingId();
    if (!id || !confirm('Удалить запись?')) return;

    this.saving.set(true);
    this.api.deleteAppointment(id).subscribe({
      next: () => {
        this.appointments.update(list => list.filter(a => a.id !== id));
        this.applyEvents(this.appointments());
        this.closePanel();
        this.saving.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(this.formatError(err, 'Не удалось удалить запись'));
      }
    });
  }

  createWorkOrder(): void {
    const id = this.editingId();
    if (!id) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.api.createWorkOrderFromAppointment(id).subscribe({
      next: appt => {
        this.replaceAppointment(appt);
        this.form = formFromAppointment(appt);
        this.saving.set(false);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(this.formatWorkOrderError(err));
      }
    });
  }

  private replaceAppointment(appt: Appointment): void {
    this.appointments.update(list => list.map(a => (a.id === appt.id ? appt : a)));
    this.applyEvents(this.appointments());
  }

  private toCalendarEvent(a: Appointment): EventInput {
    let title = a.vehicleLabel ? `${a.clientName} · ${a.vehicleLabel}` : a.clientName;
    if (a.workOrderDisplayNumber) {
      title += ` · ${a.workOrderDisplayNumber}`;
    }
    const color = statusColor(a.status);
    const hasWorkOrder = !!a.workOrderId;
    return {
      id: a.id,
      title,
      start: a.startsAt,
      end: a.endsAt,
      backgroundColor: color,
      borderColor: hasWorkOrder ? '#6a1b9a' : color,
      classNames: hasWorkOrder ? ['fc-event-has-work-order'] : []
    };
  }

  private formatWorkOrderError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 409) {
      const body = err.error;
      if (body?.workOrderDisplayNumber) {
        return `${body.message ?? 'Заказ-наряд уже создан'} (${body.workOrderDisplayNumber})`;
      }
    }
    return this.formatError(err, 'Не удалось создать заказ-наряд');
  }

  private formatError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) return parseApiError(err, fallback);
    return fallback;
  }
}

function statusColor(status: Appointment['status']): string {
  switch (status) {
    case 'Confirmed':
      return '#15803d';
    case 'Completed':
      return '#475569';
    case 'Cancelled':
      return '#dc2626';
    default:
      return '#2563eb';
  }
}
