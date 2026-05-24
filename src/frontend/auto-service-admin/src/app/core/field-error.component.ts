import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-field-error',
  host: { class: 'field-error-host' },
  template: `@if (message) {
    <p class="field-error">{{ message }}</p>
  }`
})
export class FieldErrorComponent {
  @Input() message: string | null | undefined = null;
}
