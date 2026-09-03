import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { money, statusLabel, type Shipment } from '../shared/models';

@Component({
  selector: 'app-my-shipment-detail',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      @if (loading()) { <div class="card">Cargando…</div> }
      @else if (!sh()) {
        <section class="screen">
          <h2>Envío no encontrado</h2>
          <a class="btn btn-primary" routerLink="/mis-envios">Mis envíos</a>
        </section>
      } @else {
        <h1 class="mono">{{ sh()!.code }}</h1>
        <p>{{ statusLabel(sh()!.status) }} · {{ money(sh()!.totalCents) }}</p>
        <ul>
          @for (l of sh()!.lines; track l.id) {
            <li>{{ l.label }} · {{ money(l.subtotalCents) }}</li>
          }
        </ul>
        @if (qr()) { <div class="qr" [innerHTML]="qr()"></div> }
      }
    </main>
  `,
})
export class MyShipmentDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ar = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly money = money;
  readonly statusLabel = statusLabel;
  readonly sh = signal<Shipment | null>(null);
  readonly qr = signal<SafeHtml | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const code = this.ar.snapshot.paramMap.get('code')!;
    this.api.shipmentByCode(code).pipe(catchError(() => of(null))).subscribe((s) => {
      this.loading.set(false);
      if (!s) return;
      this.sh.set(s);
      if (s.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(s.qrSvg));
    });
  }
}
