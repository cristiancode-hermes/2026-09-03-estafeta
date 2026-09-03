import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { statusLabel, type Arrival } from '../shared/models';

@Component({
  selector: 'app-arrivals',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      <h1>Casillero</h1>
      @if (loading()) { <div class="card">Cargando llegadas…</div> }
      @else if (error()) {
        <section class="screen">
          <h2>El casillero no abre</h2>
          <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
        </section>
      } @else if (!items().length) {
        <section class="screen">
          <h2>Nada en casillero</h2>
          <p>Cuando te llegue un pliego, el código aparecerá aquí.</p>
        </section>
      } @else {
        <div class="saca-list">
          @for (a of items(); track a.id) {
            <a class="saca-row" [routerLink]="['/llegada', a.code]">
              <div>
                <strong class="mono">{{ a.code }}</strong>
                <div class="muted">{{ a.senderLabel }}</div>
              </div>
              <span class="badge" [class.expired]="a.status === 'expired'">{{ statusLabel(a.status) }}</span>
            </a>
          }
        </div>
      }
    </main>
  `,
})
export class ArrivalsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly statusLabel = statusLabel;
  readonly items = signal<Arrival[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.arrivals().pipe(catchError(() => of(null))).subscribe((res) => {
      this.loading.set(false);
      if (!res) { this.error.set(true); return; }
      this.items.set(res.items);
    });
  }
}
