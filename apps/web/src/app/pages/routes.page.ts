import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { money, type RouteItem } from '../shared/models';

@Component({
  selector: 'app-routes',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      <h1>Rutas</h1>
      <p class="muted">Local, comarca, nacional, ultramar. El «desde» es el precio de esa ruta, no un número inventado.</p>
      @if (loading()) { <div class="card">Cargando rutas…</div> }
      @else if (error()) {
        <section class="screen">
          <h2>No hay cuño</h2>
          <p>No pudimos cargar las rutas.</p>
          <button class="btn btn-primary" type="button" (click)="load()">Reintentar</button>
        </section>
      } @else if (!items().length) {
        <section class="screen">
          <h2>Aún no hay rutas</h2>
          <p>Cuando el mostrador abra el cuño, aparecerán aquí.</p>
        </section>
      } @else {
        <div class="grid-routes">
          @for (r of items(); track r.id) {
            <a class="card" [routerLink]="['/rutas', r.id]">
              <figure class="figure">
                <img [src]="r.imageUrl || '/assets/mostrador.svg'" [alt]="r.caption || r.name" />
                <figcaption>{{ r.caption }}</figcaption>
              </figure>
              <h3>{{ r.name }}</h3>
              <p>{{ r.blurb }}</p>
              <p>Desde {{ money(r.fromPriceCents) }}</p>
            </a>
          }
        </div>
      }
    </main>
  `,
})
export class RoutesPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly money = money;
  readonly items = signal<RouteItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.routes().pipe(catchError(() => of(null))).subscribe((res) => {
      this.loading.set(false);
      if (!res) { this.error.set(true); return; }
      this.items.set(res.items);
    });
  }
}
