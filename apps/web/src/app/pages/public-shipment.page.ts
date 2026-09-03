import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { money, statusLabel, type Shipment } from '../shared/models';

@Component({
  selector: 'app-public-shipment',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      @if (loading()) { <div class="card">Buscando pliego…</div> }
      @else if (!sh()) {
        <section class="screen">
          <h2>Pliego no encontrado</h2>
          <p>Ese código no está en el cuño.</p>
          <a class="btn btn-primary" routerLink="/">Inicio</a>
        </section>
      } @else {
        <h1>Resguardo {{ sh()!.code }}</h1>
        <p>{{ sh()!.route?.name }} · {{ sh()!.salida?.dispatchOn }} · {{ statusLabel(sh()!.status) }}</p>
        <p>{{ money(sh()!.totalCents) }}</p>
        @if (qr()) { <div class="qr" [innerHTML]="qr()"></div> }
      }
    </main>
  `,
})
export class PublicShipmentPage implements OnInit {
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
