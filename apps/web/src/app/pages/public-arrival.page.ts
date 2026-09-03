import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { statusLabel, type Arrival } from '../shared/models';

@Component({
  selector: 'app-public-arrival',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      @if (loading()) { <div class="card">Buscando llegada…</div> }
      @else if (!a()) {
        <section class="screen">
          <h2>Llegada no encontrada</h2>
          <a class="btn btn-primary" routerLink="/">Inicio</a>
        </section>
      } @else {
        <h1 class="mono">{{ a()!.code }}</h1>
        <p>De {{ a()!.senderLabel }} · {{ statusLabel(a()!.status) }}</p>
        @if (qr()) { <div class="qr" [innerHTML]="qr()"></div> }
      }
    </main>
  `,
})
export class PublicArrivalPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ar = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly statusLabel = statusLabel;
  readonly a = signal<Arrival | null>(null);
  readonly qr = signal<SafeHtml | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const code = this.ar.snapshot.paramMap.get('code')!;
    this.api.arrivalByCode(code).pipe(catchError(() => of(null))).subscribe((r) => {
      this.loading.set(false);
      if (!r) return;
      this.a.set(r);
      if (r.qrSvg) this.qr.set(this.sanitizer.bypassSecurityTrustHtml(r.qrSvg));
    });
  }
}
