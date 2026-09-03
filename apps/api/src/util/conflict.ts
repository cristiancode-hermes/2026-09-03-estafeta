import { HttpException, HttpStatus } from '@nestjs/common';

export function conflict(code: string, message: string): never {
  throw new HttpException({ code, message }, HttpStatus.CONFLICT);
}

export const COPY = {
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
} as const;
