import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { IsOptional, IsString } from 'class-validator';
import { Paper, Route, Salida, Shipment, ShipmentLine } from '../entities/entities';
import { COPY, conflict } from '../util/conflict';
import { withLock } from '../util/lock';
import { makeQr } from '../util/qr';
import { LIVE_SHIPMENT_STATUSES, pliegoCode, webOrigin } from '../util/madrid';

export class CheckoutDto {
  @IsString()
  salidaId!: string;

  @IsOptional()
  @IsString()
  paperId?: string;
}

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Shipment) private readonly shipments: Repository<Shipment>,
  ) {}

  serialize(s: Shipment) {
    const lines = s.lines || [];
    const totalCents = lines.reduce((acc, l) => acc + l.subtotalCents, 0);
    return {
      id: s.id,
      userId: s.userId,
      routeId: s.routeId,
      salidaId: s.salidaId,
      code: s.code,
      status: s.status,
      totalCents,
      qrSvg: s.qrSvg,
      qrUrl: s.qrUrl,
      createdAt: s.createdAt,
      route: s.route
        ? { id: s.route.id, name: s.route.name, scope: s.route.scope, priceCents: s.route.priceCents }
        : undefined,
      salida: s.salida
        ? { id: s.salida.id, dispatchOn: s.salida.dispatchOn, status: s.salida.status }
        : undefined,
      lines: lines.map((l) => ({
        id: l.id,
        kind: l.kind,
        paperId: l.paperId,
        label: l.label,
        unitCents: l.unitCents,
        qty: l.qty,
        subtotalCents: l.subtotalCents,
      })),
    };
  }

  checkout(userId: string, dto: CheckoutDto) {
    return withLock(() => this.checkoutLocked(userId, dto));
  }

  private async checkoutLocked(userId: string, dto: CheckoutDto) {
    const supportsLock = this.dataSource.options.type !== 'better-sqlite3';
    return this.dataSource.transaction(async (manager) => {
      const salidaRepo = manager.getRepository(Salida);
      const qb = salidaRepo.createQueryBuilder('s').where('s.id = :id', { id: dto.salidaId });
      const salida = supportsLock ? await qb.setLock('pessimistic_write').getOne() : await qb.getOne();
      if (!salida) throw new NotFoundException('Saca no encontrada');
      if (salida.status !== 'open') conflict('SALIDA_CLOSED', COPY.SALIDA_CLOSED);

      const route = await manager.getRepository(Route).findOne({ where: { id: salida.routeId } });
      if (!route) throw new NotFoundException('Ruta no encontrada');
      if (!route.open) conflict('ROUTE_CLOSED', COPY.ROUTE_CLOSED);

      const live = await manager.getRepository(Shipment).find({
        where: { userId, salidaId: salida.id, status: In([...LIVE_SHIPMENT_STATUSES]) },
      });
      if (live.length) conflict('ALREADY_IN_BAG', COPY.ALREADY_IN_BAG);

      const used = await manager.getRepository(Shipment).count({
        where: { salidaId: salida.id, status: In([...LIVE_SHIPMENT_STATUSES]) },
      });
      if (used >= salida.capacityPliegos) conflict('BAG_FULL', COPY.BAG_FULL);

      let paper: Paper | null = null;
      if (dto.paperId) {
        const paperRepo = manager.getRepository(Paper);
        const pqb = paperRepo.createQueryBuilder('p').where('p.id = :id', { id: dto.paperId });
        paper = supportsLock ? await pqb.setLock('pessimistic_write').getOne() : await pqb.getOne();
        if (!paper) throw new NotFoundException('Papel no encontrado');
        if (paper.stock < 1) conflict('NO_PAPER', COPY.NO_PAPER);
        paper.stock -= 1;
        await paperRepo.save(paper);
      }

      const code = pliegoCode();
      const qrUrl = `${webOrigin()}/envio/${code}`;
      const qr = await makeQr(qrUrl);
      const now = new Date();
      const routeLine = { label: `Ruta ${route.name}`, unitCents: route.priceCents, qty: 1, subtotalCents: route.priceCents };
      const paperLine = paper
        ? { label: paper.name, unitCents: paper.priceCents, qty: 1, subtotalCents: paper.priceCents }
        : null;
      const totalCents = routeLine.subtotalCents + (paperLine ? paperLine.subtotalCents : 0);

      const shipment = (await manager.getRepository(Shipment).save({
        userId,
        routeId: route.id,
        salidaId: salida.id,
        code,
        status: 'confirmed',
        totalCents,
        qrSvg: qr.qrSvg,
        qrUrl: qr.qrUrl,
        createdAt: now,
      } as any)) as Shipment;

      await manager.getRepository(ShipmentLine).save({
        shipmentId: shipment.id,
        kind: 'route',
        paperId: null,
        label: routeLine.label,
        unitCents: routeLine.unitCents,
        qty: 1,
        subtotalCents: routeLine.subtotalCents,
      } as any);
      if (paperLine && paper) {
        await manager.getRepository(ShipmentLine).save({
          shipmentId: shipment.id,
          kind: 'paper',
          paperId: paper.id,
          label: paperLine.label,
          unitCents: paperLine.unitCents,
          qty: 1,
          subtotalCents: paperLine.subtotalCents,
        } as any);
      }

      const full = await manager.getRepository(Shipment).findOne({
        where: { id: shipment.id },
        relations: { lines: true, salida: true, route: true },
      });
      return this.serialize(full!);
    });
  }

  async mine(userId: string, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;
    const items = await this.shipments.find({
      where,
      relations: { lines: true, salida: true, route: true },
      order: { createdAt: 'DESC' },
    });
    const serialized = items.map((s) => this.serialize(s));
    const totalCentsSum = serialized.reduce((a, s) => a + s.totalCents, 0);
    return { items: serialized, totalCentsSum };
  }

  async mineOne(userId: string, id: string) {
    const s = await this.shipments.findOne({
      where: { id, userId },
      relations: { lines: true, salida: true, route: true },
    });
    if (!s) throw new NotFoundException('Envío no encontrado');
    return this.serialize(s);
  }

  async byCode(code: string) {
    const s = await this.shipments.findOne({
      where: { code: this.normalizeCode(code) },
      relations: { lines: true, salida: true, route: true },
    });
    if (!s) throw new NotFoundException('Envío no encontrado');
    return this.serialize(s);
  }

  normalizeCode(input: string): string {
    const raw = (input || '').trim();
    const m = raw.match(/\/envio\/([A-Z0-9]+)/i);
    return (m ? m[1] : raw).toUpperCase();
  }
}
