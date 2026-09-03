import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  API,
  Arrival,
  PaperItem,
  RouteItem,
  SalidaItem,
  Shipment,
  User,
} from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  routes(): Observable<{ items: RouteItem[]; fromPriceCents: number }> {
    return this.http.get<{ items: RouteItem[]; fromPriceCents: number }>(`${API}/routes`);
  }
  route(id: string): Observable<RouteItem> {
    return this.http.get<RouteItem>(`${API}/routes/${id}`);
  }
  papers(): Observable<{ items: PaperItem[] }> {
    return this.http.get<{ items: PaperItem[] }>(`${API}/papers`);
  }
  salidas(routeId?: string): Observable<{ items: SalidaItem[] }> {
    let params = new HttpParams();
    if (routeId) params = params.set('routeId', routeId);
    return this.http.get<{ items: SalidaItem[] }>(`${API}/salidas`, { params });
  }
  salida(id: string): Observable<SalidaItem> {
    return this.http.get<SalidaItem>(`${API}/salidas/${id}`);
  }
  checkout(body: { salidaId: string; paperId?: string }): Observable<Shipment> {
    return this.http.post<Shipment>(`${API}/shipments/checkout`, body);
  }
  shipments(): Observable<{ items: Shipment[]; totalCentsSum: number }> {
    return this.http.get<{ items: Shipment[]; totalCentsSum: number }>(`${API}/shipments`);
  }
  shipment(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${API}/shipments/${id}`);
  }
  shipmentByCode(code: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${API}/shipments/by-code/${encodeURIComponent(code)}`);
  }
  arrivals(): Observable<{ items: Arrival[] }> {
    return this.http.get<{ items: Arrival[] }>(`${API}/arrivals`);
  }
  arrivalByCode(code: string): Observable<Arrival> {
    return this.http.get<Arrival>(`${API}/arrivals/by-code/${encodeURIComponent(code)}`);
  }
  profile(): Observable<User> {
    return this.http.get<User>(`${API}/auth/profile`);
  }
  patchProfile(displayName: string): Observable<User> {
    return this.http.patch<User>(`${API}/auth/profile`, { displayName });
  }
  staffToday(): Observable<{ dropped: number; dispatched: number; pickups: number }> {
    return this.http.get<{ dropped: number; dispatched: number; pickups: number }>(`${API}/staff/today`);
  }
  stats(): Observable<{ points: { date: string; value: number }[] }> {
    return this.http.get<{ points: { date: string; value: number }[] }>(`${API}/stats/dispatched?days=14`);
  }
  scan(body: { codeOrUrl: string; action: string; voice?: string }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${API}/staff/scan`, body);
  }
  adminRoute(body: { name: string; scope: string; priceCents: number }): Observable<RouteItem> {
    return this.http.post<RouteItem>(`${API}/admin/routes`, body);
  }
  patchRoute(id: string, body: { open?: boolean; priceCents?: number }): Observable<RouteItem> {
    return this.http.patch<RouteItem>(`${API}/admin/routes/${id}`, body);
  }
  adminSalida(body: { routeId: string; dispatchOn: string; capacityPliegos: number }): Observable<SalidaItem> {
    return this.http.post<SalidaItem>(`${API}/admin/salidas`, body);
  }
  patchSalida(id: string, status: string): Observable<SalidaItem> {
    return this.http.patch<SalidaItem>(`${API}/admin/salidas/${id}`, { status });
  }
  adminPaper(body: { name: string; priceCents: number; stock: number }): Observable<PaperItem> {
    return this.http.post<PaperItem>(`${API}/admin/papers`, body);
  }
  patchPaper(id: string, body: { stock?: number; priceCents?: number }): Observable<PaperItem> {
    return this.http.patch<PaperItem>(`${API}/admin/papers/${id}`, body);
  }
  adminArrival(body: { userId: string; senderLabel: string; pickupHours?: number }): Observable<Arrival> {
    return this.http.post<Arrival>(`${API}/admin/arrivals`, body);
  }
}
