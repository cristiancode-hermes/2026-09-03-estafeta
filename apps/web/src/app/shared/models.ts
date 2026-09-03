export const API = '/api';
export const TOKEN_KEY = 'estafeta.jwt';
export const THEME_KEY = 'estafeta-theme';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'staff' | 'admin' | string;
  displayName?: string | null;
  points: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RouteItem {
  id: string;
  slug: string;
  name: string;
  scope: string;
  blurb: string | null;
  imageUrl: string | null;
  caption: string | null;
  priceCents: number;
  fromPriceCents: number;
  open: boolean;
  salidas?: SalidaItem[];
}

export interface SalidaItem {
  id: string;
  routeId: string;
  dispatchOn: string;
  capacityPliegos: number;
  remainingPliegos: number;
  status: string;
  route?: RouteItem;
}

export interface PaperItem {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
}

export interface ShipmentLine {
  id: string;
  kind: string;
  paperId: string | null;
  label: string;
  unitCents: number;
  qty: number;
  subtotalCents: number;
}

export interface Shipment {
  id: string;
  userId: string;
  routeId: string;
  salidaId: string;
  code: string;
  status: string;
  totalCents: number;
  qrSvg: string | null;
  qrUrl: string | null;
  createdAt: string;
  route?: { id: string; name: string; scope: string; priceCents: number };
  salida?: { id: string; dispatchOn: string; status: string };
  lines: ShipmentLine[];
}

export interface Arrival {
  id: string;
  userId: string;
  code: string;
  senderLabel: string;
  status: string;
  qrSvg: string | null;
  qrUrl: string | null;
  pickupExpiresAt: string;
  createdAt: string;
  message?: string;
}

export function money(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function humanizeApiError(err: unknown): string {
  const e = err as { error?: { code?: string; message?: string }; message?: string };
  const body = (e as { error?: { code?: string; message?: string } })?.error;
  const code = body?.code;
  const map: Record<string, string> = {
    ALREADY_IN_BAG: 'Ya tienes un pliego en esta saca.',
    BAG_FULL: 'Esta saca ya está completa.',
    SALIDA_CLOSED: 'Esa saca ya no admite pliegos.',
    NO_PAPER: 'Ese papel se ha agotado.',
    ROUTE_CLOSED: 'Esa ruta no está en el cuño.',
    ALREADY_DROPPED: 'Este pliego ya está en mostrador.',
    ALREADY_DISPATCHED: 'Este pliego ya salió en saca.',
    ALREADY_PICKED_UP: 'Esta llegada ya se entregó.',
    ARRIVAL_EXPIRED: 'Esta llegada caducó en casillero.',
    NOT_DROPPED: 'Este pliego aún no está en mostrador.',
  };
  if (code && map[code]) return map[code];
  const msg = body?.message || (typeof e.message === 'string' ? e.message : '');
  const stripped = msg.replace(/^[A-Z_]+:\s*/, '');
  return stripped || 'No se pudo completar. Inténtalo de nuevo.';
}

export function statusLabel(s: string): string {
  const m: Record<string, string> = {
    confirmed: 'Confirmado',
    dropped: 'En mostrador',
    dispatched: 'Despachado',
    cancelled: 'Cancelado',
    arrived: 'En casillero',
    picked_up: 'Recogido',
    expired: 'Caducado',
    open: 'Abierta',
    closed: 'Cerrada',
  };
  return m[s] || s;
}
