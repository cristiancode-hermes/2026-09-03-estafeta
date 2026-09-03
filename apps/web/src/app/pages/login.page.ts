import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { humanizeApiError } from '../shared/models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-split">
      <div class="auth-visual">
        <img src="/assets/mostrador.svg" alt="Mostrador de la estafeta con casilleros y lacre" />
        <div class="auth-visual-overlay">
          <p class="kicker" style="color:#C9A227">Estafeta</p>
          <h1 style="color:#fff">El pliego se mete en la saca.</h1>
          <p style="color:#E8EAEE">Correo de barrio. Cupo real, cobro al momento, QR en el mostrador.</p>
        </div>
      </div>
      <div class="auth-form-side">
        <form class="auth-form" (ngSubmit)="submit()">
          <h2>Entrar</h2>
          <p class="muted">Usuario o email. Sin caja: el cuño basta.</p>
          <label class="form-field">
            Usuario o email
            <input
              name="identifier"
              [ngModel]="identifier()"
              (ngModelChange)="identifier.set($event)"
              autocomplete="off"
              required
            />
          </label>
          <label class="form-field">
            Contraseña
            <input
              type="password"
              name="password"
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              autocomplete="new-password"
              required
            />
          </label>
          @if (error()) {
            <p class="cta-error">{{ error() }}</p>
          }
          <button class="btn btn-primary" type="submit" [disabled]="auth.loading()">Entrar</button>
          <p><a routerLink="/registro">Crear cuenta</a></p>
          <div class="auth-demo">
            <p>Cuenta de prueba con datos</p>
            <p><code>demo@estafeta.dev</code> · <code>demo1234</code></p>
            <p>Staff: <code>staff@estafeta.dev</code> · <code>demo1234</code></p>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly identifier = signal('');
  readonly password = signal('');
  readonly error = signal('');

  submit(): void {
    this.error.set('');
    this.auth.login({ identifier: this.identifier(), password: this.password() }).subscribe({
      next: () => {
        this.auth.revalidateSession();
        const ret = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        void this.router.navigateByUrl(ret);
      },
      error: (err) => this.error.set(humanizeApiError(err)),
    });
  }
}
