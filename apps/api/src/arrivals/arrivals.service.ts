import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Arrival } from '../entities/entities';

@Injectable()
export class ArrivalsService {
  constructor(@InjectRepository(Arrival) private readonly arrivals: Repository<Arrival>) {}

  serialize(a: Arrival) {
    return {
      id: a.id,
      userId: a.userId,
      code: a.code,
      senderLabel: a.senderLabel,
      status: a.status,
      qrSvg: a.qrSvg,
      qrUrl: a.qrUrl,
      pickupExpiresAt: a.pickupExpiresAt,
      createdAt: a.createdAt,
    };
  }

  async expireStale(now = new Date()) {
    const stale = await this.arrivals.find({
      where: { status: 'arrived', pickupExpiresAt: LessThan(now) },
    });
    for (const a of stale) {
      a.status = 'expired';
      await this.arrivals.save(a);
    }
    return stale.length;
  }

  async mine(userId: string) {
    await this.expireStale();
    const items = await this.arrivals.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return { items: items.map((a) => this.serialize(a)) };
  }

  async byCode(code: string) {
    await this.expireStale();
    const raw = (code || '').trim();
    const m = raw.match(/\/llegada\/([A-Z0-9]+)/i);
    const c = (m ? m[1] : raw).toUpperCase();
    const a = await this.arrivals.findOne({ where: { code: c } });
    if (!a) throw new NotFoundException('Llegada no encontrada');
    return this.serialize(a);
  }
}
