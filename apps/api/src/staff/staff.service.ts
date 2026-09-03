import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Arrival, ScanEvent, Shipment } from '../entities/entities';
import { COPY, conflict } from '../util/conflict';
import { ArrivalsService } from '../arrivals/arrivals.service';
import { madridDateList, madridToday } from '../util/madrid';

export class ScanDto {
  @IsString()
  codeOrUrl!: string;

  @IsString()
  @IsIn(['drop', 'dispatch', 'pickup'])
  action!: 'drop' | 'dispatch' | 'pickup';

  @IsOptional()
  @IsString()
  @IsIn(['self', 'staff'])
  voice?: 'self' | 'staff';
}

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Shipment) private readonly shipments: Repository<Shipment>,
    @InjectRepository(Arrival) private readonly arrivals: Repository<Arrival>,
    @InjectRepository(ScanEvent) private readonly scans: Repository<ScanEvent>,
    private readonly arrivalsSvc: ArrivalsService,
  ) {}

  extractCode(input: string): { kind: 'envio' | 'llegada' | 'unknown'; code: string } {
    const raw = (input || '').trim();
    const envio = raw.match(/\/envio\/([A-Z0-9]+)/i);
    if (envio) return { kind: 'envio', code: envio[1].toUpperCase() };
    const llegada = raw.match(/\/llegada\/([A-Z0-9]+)/i);
    if (llegada) return { kind: 'llegada', code: llegada[1].toUpperCase() };
    return { kind: 'unknown', code: raw.toUpperCase() };
  }

  async scan(staffUserId: string, dto: ScanDto) {
    await this.arrivalsSvc.expireStale();
    const parsed = this.extractCode(dto.codeOrUrl);
    const voice = dto.voice || 'staff';
    const staffMsg = (code: keyof typeof COPY) => COPY[code];

    if (dto.action === 'pickup') {
      const arrival = await this.arrivals.findOne({ where: { code: parsed.code } });
      if (!arrival) throw new NotFoundException('Llegada no encontrada');
      if (arrival.status === 'picked_up') conflict('ALREADY_PICKED_UP', staffMsg('ALREADY_PICKED_UP'));
      if (arrival.status === 'expired') conflict('ARRIVAL_EXPIRED', staffMsg('ARRIVAL_EXPIRED'));
      arrival.status = 'picked_up';
      await this.arrivals.save(arrival);
      await this.scans.save({
        staffUserId,
        shipmentId: null,
        arrivalId: arrival.id,
        action: 'pickup',
        voice,
        createdAt: new Date(),
      } as any);
      return { ...this.arrivalsSvc.serialize(arrival), message: 'Llegada entregada al vecino.' };
    }

    const shipment = await this.shipments.findOne({
      where: { code: parsed.code },
      relations: { lines: true, salida: true, route: true },
    });
    if (!shipment) throw new NotFoundException('Pliego no encontrado');

    if (dto.action === 'drop') {
      if (shipment.status === 'dropped') conflict('ALREADY_DROPPED', staffMsg('ALREADY_DROPPED'));
      if (shipment.status === 'dispatched') conflict('ALREADY_DISPATCHED', staffMsg('ALREADY_DISPATCHED'));
      shipment.status = 'dropped';
      await this.shipments.save(shipment);
      await this.scans.save({
        staffUserId,
        shipmentId: shipment.id,
        arrivalId: null,
        action: 'drop',
        voice,
        createdAt: new Date(),
      } as any);
      return { code: shipment.code, status: shipment.status, message: 'Pliego admitido en mostrador.' };
    }

    if (shipment.status !== 'dropped') conflict('NOT_DROPPED', staffMsg('NOT_DROPPED'));
    shipment.status = 'dispatched';
    await this.shipments.save(shipment);
    await this.scans.save({
      staffUserId,
      shipmentId: shipment.id,
      arrivalId: null,
      action: 'dispatch',
      voice,
      createdAt: new Date(),
    } as any);
    return { code: shipment.code, status: shipment.status, message: 'Pliego despachado en saca.' };
  }

  async today() {
    const today = madridToday();
    const scans = await this.scans.find();
    const ofToday = scans.filter((s) => madridToday(s.createdAt) === today);
    return {
      dropped: ofToday.filter((s) => s.action === 'drop').length,
      dispatched: ofToday.filter((s) => s.action === 'dispatch').length,
      pickups: ofToday.filter((s) => s.action === 'pickup').length,
    };
  }

  async dispatchedStats(days = 14) {
    const dates = madridDateList(days);
    const rows = await this.shipments.find({ where: { status: 'dispatched' } });
    const counts = new Map<string, number>();
    for (const r of rows) {
      const d = madridToday(r.createdAt);
      counts.set(d, (counts.get(d) || 0) + 1);
    }
    return {
      points: dates.map((date) => ({ date, value: counts.get(date) || 0 })),
    };
  }
}
