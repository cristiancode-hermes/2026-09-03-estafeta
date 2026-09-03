import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { humanizeApiError } from '../shared/models';

@Component({
  selector: 'app-staff-scan',
  imports: [FormsModule],
  template: `
    <main class="wrap">
      <h1>Escanear</h1>
      <p class="muted">Pega el código o la URL del resguardo. El mostrador admite pliego (drop/dispatch) o llegada (pickup).</p>
      <label class="form-field">Código o URL
        <input [ngModel]="code()" (ngModelChange)="code.set($event)" name="code" autocomplete="off" />
      </label>
      <label class="form-field">Acción
        <select [ngModel]="action()" (ngModelChange)="action.set($event)">
          <option value="drop">Admitir en mostrador</option>
          <option value="dispatch">Despachar saca</option>
          <option value="pickup">Entregar llegada</option>
        </select>
      </label>
      <div id="pay-action">
        <button class="btn btn-primary" type="button" (click)="go()">Registrar</button>
        @if (msg()) { <p>{{ msg() }}</p> }
        @if (err()) { <p class="cta-error">{{ err() }}</p> }
      </div>
    </main>
  `,
})
export class StaffScanPage {
  private readonly api = inject(ApiService);
  readonly code = signal('');
  readonly action = signal('drop');
  readonly msg = signal('');
  readonly err = signal('');

  go(): void {
    this.err.set('');
    this.msg.set('');
    this.api.scan({ codeOrUrl: this.code(), action: this.action(), voice: 'staff' }).subscribe({
      next: (res) => this.msg.set(String(res['message'] || 'Hecho')),
      error: (e) => {
        this.err.set(humanizeApiError(e));
        document.getElementById('pay-action')?.scrollIntoView({ block: 'center' });
      },
    });
  }
}
