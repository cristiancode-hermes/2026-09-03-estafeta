import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { money, statusLabel, type Shipment } from '../shared/models';

@Component({
  selector: 'app-my-shipments',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      <h1>Mis envíos</h1>
      @if (loading()) { <div class="card">Cargando…</div> }
      @else if (error()) {
        <section class="screen">
          <h2>No pudimos abrir el libro</h2>
          <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
        </section>
      } @else if (!items().length) {
        <section class="screen">
          <h2>Aún no hay pliegos</h2>
          <p>Cuando pagues una saca, el resguardo sale aquí.</p>
          <a class="btn btn-primary" routerLink="/rutas">Ver rutas</a>
        </section>
      } @else {
        <p>Total {{ money(sum()) }}</p>
        <div class="saca-list">
          @for (s of items(); track s.id) {
            <a class="saca-row" [routerLink]="['/mis-envios', s.code]">
              <div>
                <strong class="mono">{{ s.code }}</strong>
                <div class="muted">{{ s.route?.name }} · {{ s.salida?.dispatchOn }} · {{ money(s.totalCents) }}</div>
              </div>
              <span class="badge" [class.dispatched]="s.status === 'dispatched'" [class.dropped]="s.status === 'dropped'">{{ statusLabel(s.status) }}</span>
            </a>
          }
        </div>
      }
    </main>
  `,
})
export class MyShipmentsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly money = money;
  readonly statusLabel = statusLabel;
  readonly items = signal<Shipment[]>([]);
  readonly sum = signal(0);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.shipments().pipe(catchError(() => of(null))).subscribe((res) => {
      this.loading.set(false);
      if (!res) { this.error.set(true); return; }
      this.items.set(res.items);
      this.sum.set(res.totalCentsSum);
    });
  }
}
