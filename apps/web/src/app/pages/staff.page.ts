import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-staff',
  imports: [RouterLink],
  template: `
    <main class="wrap">
      <h1>Mostrador</h1>
      <p><a class="btn btn-primary" routerLink="/staff/scan">Escanear QR</a></p>
      @if (today()) {
        <p>Hoy: {{ today()!.dropped }} en mostrador · {{ today()!.dispatched }} despachados · {{ today()!.pickups }} entregas</p>
      }
      <h2>Despachos 14 días</h2>
      @if (points().length) {
        <svg class="chart" viewBox="0 0 560 200" role="img" aria-label="Despachos de 14 días">
          <line x1="40" y1="10" x2="40" y2="170" stroke="currentColor" />
          <line x1="40" y1="170" x2="540" y2="170" stroke="currentColor" />
          @for (p of bars(); track p.date) {
            <rect [attr.x]="p.x" [attr.y]="p.y" [attr.width]="24" [attr.height]="p.h" fill="var(--color-primary)">
              <title>{{ p.date }}: {{ p.value }}</title>
            </rect>
            <text [attr.x]="p.x + 12" y="188" text-anchor="middle" font-size="9" fill="currentColor">{{ p.label }}</text>
          }
        </svg>
      }
    </main>
  `,
})
export class StaffPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly today = signal<{ dropped: number; dispatched: number; pickups: number } | null>(null);
  readonly points = signal<{ date: string; value: number }[]>([]);
  readonly bars = signal<Array<{ date: string; value: number; x: number; y: number; h: number; label: string }>>([]);

  ngOnInit(): void {
    this.api.staffToday().pipe(catchError(() => of(null))).subscribe((t) => this.today.set(t));
    this.api.stats().pipe(catchError(() => of({ points: [] }))).subscribe((s) => {
      this.points.set(s.points);
      const max = Math.max(1, ...s.points.map((p) => p.value));
      this.bars.set(
        s.points.map((p, i) => ({
          date: p.date,
          value: p.value,
          x: 50 + i * 35,
          h: (p.value / max) * 140,
          y: 170 - (p.value / max) * 140,
          label: p.date.slice(5),
        })),
      );
    });
  }
}
