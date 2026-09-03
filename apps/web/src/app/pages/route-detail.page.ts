import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { money, type RouteItem } from '../shared/models';

@Component({
  selector: 'app-route-detail',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      @if (loading()) { <div class="card">Cargando ruta…</div> }
      @else if (error()) {
        <section class="screen">
          <h2>Ruta no encontrada</h2>
          <p>Ese cuño no está en el mostrador.</p>
          <a class="btn btn-primary" routerLink="/rutas">Volver a rutas</a>
        </section>
      } @else if (route()) {
        <figure class="figure" style="max-width:640px">
          <img [src]="route()!.imageUrl || '/assets/mostrador.svg'" [alt]="route()!.caption || route()!.name" />
          <figcaption>{{ route()!.caption }}</figcaption>
        </figure>
        <h1>{{ route()!.name }}</h1>
        <p>{{ route()!.blurb }}</p>
        <p>Desde {{ money(route()!.fromPriceCents) }}</p>
        <h2>Sacas</h2>
        <div class="saca-list">
          @for (s of route()!.salidas || []; track s.id) {
            <article class="saca-row">
              <div>
                <div>{{ s.dispatchOn }}</div>
                <div class="muted">{{ s.remainingPliegos }} libres de {{ s.capacityPliegos }}</div>
              </div>
              @if (s.status === 'open' && s.remainingPliegos > 0) {
                <a class="btn btn-primary" [routerLink]="['/salidas', s.id]">Poner pliego</a>
              } @else {
                <span class="badge">{{ s.status === 'closed' ? 'Cerrada' : 'Completa' }}</span>
              }
            </article>
          }
        </div>
      }
    </main>
  `,
})
export class RouteDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ar = inject(ActivatedRoute);
  readonly money = money;
  readonly route = signal<RouteItem | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    const id = this.ar.snapshot.paramMap.get('id')!;
    this.api.route(id).pipe(catchError(() => of(null))).subscribe((r) => {
      this.loading.set(false);
      if (!r) this.error.set(true);
      else this.route.set(r);
    });
  }
}
