import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { humanizeApiError, money, type PaperItem, type SalidaItem } from '../shared/models';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="wrap">
      @if (loading()) { <div class="card">Preparando el pliego…</div> }
      @else if (errorLoad()) {
        <section class="screen">
          <h2>No hay saca</h2>
          <p>Esa bolsa no se puede cobrar.</p>
          <a class="btn btn-primary" routerLink="/rutas">Volver</a>
        </section>
      } @else if (salida()) {
        <h1>Pagar pliego</h1>
        <p>{{ salida()!.route?.name }} · {{ salida()!.dispatchOn }} · {{ salida()!.remainingPliegos }} libres</p>
        <div class="grid-2">
          <div>
            <h2>Papel</h2>
            <label class="form-field">
              Extra (opcional)
              <select [ngModel]="paperId()" (ngModelChange)="paperId.set($event)">
                <option value="">Sin extra</option>
                @for (p of papers(); track p.id) {
                  <option [value]="p.id" [disabled]="p.stock < 1">{{ p.name }} · {{ money(p.priceCents) }} ({{ p.stock }})</option>
                }
              </select>
            </label>
            <div id="pay-action">
              <button class="btn btn-primary" type="button" (click)="pay()" [disabled]="paying()">Pagar ahora</button>
              @if (ctaError()) { <p class="cta-error">{{ ctaError() }}</p> }
            </div>
          </div>
          <aside class="card">
            <h2>Resumen</h2>
            <p>Ruta {{ money(salida()!.route?.priceCents || 0) }}</p>
            @if (selectedPaper()) {
              <p>{{ selectedPaper()!.name }} {{ money(selectedPaper()!.priceCents) }}</p>
            }
            <p><strong>Total {{ money(liveTotal()) }}</strong></p>
          </aside>
        </div>
      }
    </main>
  `,
})
export class CheckoutPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ar = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly money = money;
  readonly salida = signal<SalidaItem | null>(null);
  readonly papers = signal<PaperItem[]>([]);
  readonly paperId = signal('');
  readonly loading = signal(true);
  readonly errorLoad = signal(false);
  readonly paying = signal(false);
  readonly ctaError = signal('');

  readonly selectedPaper = computed(() => this.papers().find((p) => p.id === this.paperId()) || null);
  readonly liveTotal = computed(() => {
    const base = this.salida()?.route?.priceCents || 0;
    return base + (this.selectedPaper()?.priceCents || 0);
  });

  ngOnInit(): void {
    const id = this.ar.snapshot.queryParamMap.get('salida');
    if (!id) {
      this.loading.set(false);
      this.errorLoad.set(true);
      return;
    }
    this.api.salida(id).pipe(catchError(() => of(null))).subscribe((s) => {
      if (!s) {
        this.errorLoad.set(true);
        this.loading.set(false);
        return;
      }
      this.salida.set(s);
      this.api.papers().pipe(catchError(() => of({ items: [] }))).subscribe((p) => {
        this.papers.set(p.items);
        this.loading.set(false);
      });
    });
  }

  pay(): void {
    const s = this.salida();
    if (!s) return;
    this.paying.set(true);
    this.ctaError.set('');
    const body: { salidaId: string; paperId?: string } = { salidaId: s.id };
    if (this.paperId()) body.paperId = this.paperId();
    this.api.checkout(body).subscribe({
      next: (sh) => void this.router.navigate(['/confirmacion', sh.code]),
      error: (err) => {
        this.paying.set(false);
        this.ctaError.set(humanizeApiError(err));
        document.getElementById('pay-action')?.scrollIntoView({ block: 'center' });
      },
    });
  }
}
