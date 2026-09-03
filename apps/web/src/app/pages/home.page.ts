import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { money, type RouteItem, type SalidaItem } from '../shared/models';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      <section class="hero">
        <div>
          <p class="kicker">Estafeta</p>
          <h1>El pliego no se retiene. Se mete en la saca.</h1>
          <p class="muted">Elige ruta y fecha de despacho, paga al momento y deja el QR en el mostrador. Sin huecos de las cinco, sin cuarto de hora.</p>
          @if (fromPrice() !== null) {
            <p>Desde {{ money(fromPrice()!) }} según la ruta abierta más barata.</p>
          }
          <a class="btn btn-primary" routerLink="/rutas">Ver rutas</a>
        </div>
        <figure class="figure">
          <img src="/assets/casilleros.svg" alt="Casilleros del mostrador" />
          <figcaption>Casilleros del mostrador</figcaption>
        </figure>
      </section>

      @if (loading()) {
        <div class="card">Cargando sacas…</div>
      } @else if (loadError()) {
        <section class="screen">
          <h2>No pudimos abrir el cuño</h2>
          <p>Revisa la conexión y vuelve a intentar.</p>
          <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
        </section>
      } @else {
        <h2>Próximas sacas</h2>
        <div class="saca-list">
          @for (s of salidas(); track s.id) {
            <article class="saca-row" [class.full]="s.remainingPliegos <= 0 || s.status !== 'open'">
              <div>
                <strong>{{ s.route?.name }}</strong>
                <div class="muted">{{ s.dispatchOn }} · {{ s.remainingPliegos }} libres de {{ s.capacityPliegos }}</div>
              </div>
              @if (s.status === 'open' && s.remainingPliegos > 0) {
                <a class="btn btn-secondary" [routerLink]="['/salidas', s.id]">Elegir saca</a>
              } @else {
                <span class="badge">{{ s.status === 'closed' ? 'Cerrada' : 'Completa' }}</span>
              }
            </article>
          }
        </div>

        <h2 style="margin-top:48px">Rutas</h2>
        <div class="grid-routes">
          @for (r of routes(); track r.id) {
            <a class="card" [routerLink]="['/rutas', r.id]">
              <figure class="figure">
                <img [src]="r.imageUrl || '/assets/mostrador.svg'" [alt]="r.caption || r.name" />
                <figcaption>{{ r.caption }}</figcaption>
              </figure>
              <h3>{{ r.name }}</h3>
              <p class="muted">{{ r.blurb }}</p>
              <p>Desde {{ money(r.fromPriceCents) }}</p>
            </a>
          }
        </div>
      }
    </main>
  `,
})
export class HomePage implements OnInit {
  private readonly api = inject(ApiService);
  readonly money = money;
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly routes = signal<RouteItem[]>([]);
  readonly salidas = signal<SalidaItem[]>([]);
  readonly fromPrice = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.routes().pipe(catchError(() => of(null))).subscribe((res) => {
      if (!res) {
        this.loadError.set(true);
        this.loading.set(false);
        return;
      }
      this.routes.set(res.items);
      this.fromPrice.set(res.fromPriceCents);
      this.api.salidas().pipe(catchError(() => of({ items: [] }))).subscribe((s) => {
        this.salidas.set(s.items.filter((x) => x.status !== 'dispatched').slice(0, 6));
        this.loading.set(false);
      });
    });
  }
}
