import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { money, type PaperItem, type RouteItem, type SalidaItem } from '../shared/models';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  template: `
    <main class="wrap">
      <h1>Admin</h1>
      <h2>Rutas</h2>
      @for (r of routes(); track r.id) {
        <div class="saca-row">
          <div>{{ r.name }} · {{ money(r.priceCents) }} · {{ r.open ? 'abierta' : 'cerrada' }}</div>
          <button class="btn btn-secondary" type="button" (click)="toggle(r)">{{ r.open ? 'Cerrar' : 'Abrir' }}</button>
        </div>
      }
      <h2>Sacas</h2>
      @for (s of salidas(); track s.id) {
        <div class="saca-row">
          <div>{{ s.route?.name }} {{ s.dispatchOn }} · {{ s.status }} · {{ s.remainingPliegos }} libres</div>
          @if (s.status === 'open') {
            <button class="btn btn-secondary" type="button" (click)="closeS(s)">Cerrar</button>
          }
        </div>
      }
      <h2>Nueva saca</h2>
      <label class="form-field">Ruta
        <select [ngModel]="routeId()" (ngModelChange)="routeId.set($event)">
          @for (r of routes(); track r.id) { <option [value]="r.id">{{ r.name }}</option> }
        </select>
      </label>
      <label class="form-field">Fecha
        <input [ngModel]="dispatchOn()" (ngModelChange)="dispatchOn.set($event)" name="dispatchOn" placeholder="YYYY-MM-DD" />
      </label>
      <label class="form-field">Cupo
        <input type="number" [ngModel]="cap()" (ngModelChange)="cap.set(+$event)" name="cap" />
      </label>
      <button class="btn btn-primary" type="button" (click)="createS()">Crear saca</button>
      <h2>Papel</h2>
      @for (p of papers(); track p.id) {
        <p>{{ p.name }} · {{ money(p.priceCents) }} · stock {{ p.stock }}</p>
      }
    </main>
  `,
})
export class AdminPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly money = money;
  readonly routes = signal<RouteItem[]>([]);
  readonly salidas = signal<SalidaItem[]>([]);
  readonly papers = signal<PaperItem[]>([]);
  readonly routeId = signal('');
  readonly dispatchOn = signal('');
  readonly cap = signal(8);

  ngOnInit(): void { this.refresh(); }
  refresh(): void {
    this.api.routes().subscribe((r) => {
      this.routes.set(r.items);
      if (!this.routeId() && r.items[0]) this.routeId.set(r.items[0].id);
    });
    this.api.salidas().subscribe((s) => this.salidas.set(s.items));
    this.api.papers().subscribe((p) => this.papers.set(p.items));
  }
  toggle(r: RouteItem): void {
    this.api.patchRoute(r.id, { open: !r.open }).subscribe(() => this.refresh());
  }
  closeS(s: SalidaItem): void {
    this.api.patchSalida(s.id, 'closed').subscribe(() => this.refresh());
  }
  createS(): void {
    this.api.adminSalida({ routeId: this.routeId(), dispatchOn: this.dispatchOn(), capacityPliegos: this.cap() }).subscribe(() => this.refresh());
  }
}
