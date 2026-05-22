import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Client } from '../../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container">
      <h1>Клиенты</h1>

      <div class="card" style="margin-bottom: 1.5rem;">
        <h2>Новый клиент</h2>
        <form (ngSubmit)="addClient()">
          <label>ФИО</label>
          <input [(ngModel)]="form.fullName" name="fullName" required />
          <label>Телефон</label>
          <input [(ngModel)]="form.phone" name="phone" required />
          <label>Email</label>
          <input type="email" [(ngModel)]="form.email" name="email" />
          <label>Заметки</label>
          <textarea [(ngModel)]="form.notes" name="notes" rows="2"></textarea>
          <button type="submit" [disabled]="saving()">Добавить</button>
        </form>
      </div>

      <div class="card">
        @if (loading()) {
          <p>Загрузка...</p>
        } @else if (clients().length === 0) {
          <p>Клиентов пока нет.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of clients(); track c.id) {
                <tr>
                  <td>{{ c.fullName }}</td>
                  <td>{{ c.phone }}</td>
                  <td>{{ c.email ?? '—' }}</td>
                  <td>
                    <button type="button" class="danger" (click)="remove(c.id)">Удалить</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `
})
export class ClientsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);

  form = { fullName: '', phone: '', email: '', notes: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getClients().subscribe({
      next: list => {
        this.clients.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addClient(): void {
    this.saving.set(true);
    this.api.createClient({
      fullName: this.form.fullName,
      phone: this.form.phone,
      email: this.form.email || undefined,
      notes: this.form.notes || undefined
    }).subscribe({
      next: client => {
        this.clients.update(list => [client, ...list]);
        this.form = { fullName: '', phone: '', email: '', notes: '' };
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  remove(id: string): void {
    if (!confirm('Удалить клиента?')) return;
    this.api.deleteClient(id).subscribe({
      next: () => this.clients.update(list => list.filter(c => c.id !== id))
    });
  }
}
