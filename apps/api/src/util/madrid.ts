const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function madridToday(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function webOrigin(): string {
  return (process.env.WEB_ORIGIN || 'https://estafeta.proyectos.cristiancode.dev').replace(
    /\/$/,
    '',
  );
}

export function pliegoCode(prefix = ''): string {
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)];
  }
  return prefix + out;
}

export function madridDateList(days: number, end = new Date()): string[] {
  const today = madridToday(end);
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--) list.push(addDaysIso(today, -i));
  return list;
}

export const LIVE_SHIPMENT_STATUSES = ['confirmed', 'dropped', 'dispatched'] as const;
