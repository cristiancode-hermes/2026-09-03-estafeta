import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { money, type SalidaItem } from '../shared/models';

@Component({
  selector: 'app-salida-detail',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      @if (loading()) { <div class="card">Cargando saca…</div> }
      @else if (error()) {
        <section class="screen">
          <h2>Saca no encontrada</h2>
          <p>Esa bolsa no está en el cuño.</p>
          <a class="btn btn-primary" routerLink="/rutas">Ver rutas</a>
        </section>
      } @else if (s()) {
        <h1>{{ s()!.route?.name }} · {{ s()!.dispatchOn }}</h1>
        <p>{{ s()!.remainingPliegos }} pliegos libres de {{ s()!.capacityPliegos }}.</p>
        <p>Tarifa {{ money(s()!.route?.priceCents || 0) }}.</p>
        @if (s()!.status === 'open' && s()!.remainingPliegos > 0) {
          <a class="btn btn-primary" [routerLink]="['/checkout']" [queryParams]="{ salida: s()!.id }">Pagar pliego</a>
        } @else {
          <p class="muted">Esta saca ya no admite pliegos.</p>
        }
      }
    </main>
  `,
})
export class SalidaDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ar = inject(ActivatedRoute);
  readonly money = money;
  readonly s = signal<SalidaItem | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    const id = this.ar.snapshot.paramMap.get('id')!;
    this.api.salida(id).pipe(catchError(() => of(null))).subscribe((r) => {
      this.loading.set(false);
      if (!r) this.error.set(true);
      else this.s.set(r);
    });
  }
}
