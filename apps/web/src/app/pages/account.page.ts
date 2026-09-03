import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-account',
  imports: [FormsModule],
  template: `
    <main class="wrap">
      <h1>Cuenta</h1>
      @if (auth.user(); as u) {
        <p>{{ u.displayName || u.username }} · {{ u.email }}</p>
        <p>Puntos de estafeta (pliegos despachados): <strong>{{ u.points }}</strong></p>
        <label class="form-field">Nombre
          <input [ngModel]="name()" (ngModelChange)="name.set($event)" name="displayName" autocomplete="off" />
        </label>
        <button class="btn btn-secondary" type="button" (click)="save()">Guardar</button>
        @if (ok()) { <p class="muted">Guardado.</p> }
      }
    </main>
  `,
})
export class AccountPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  readonly name = signal('');
  readonly ok = signal(false);

  ngOnInit(): void {
    this.name.set(this.auth.user()?.displayName || '');
  }

  save(): void {
    this.api.patchProfile(this.name()).subscribe((u) => {
      this.auth.setUser(u);
      this.ok.set(true);
    });
  }
}
