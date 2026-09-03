import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Paper, Route, Salida, Shipment } from '../entities/entities';
import { LIVE_SHIPMENT_STATUSES } from '../util/madrid';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Route) private readonly routes: Repository<Route>,
    @InjectRepository(Paper) private readonly papers: Repository<Paper>,
    @InjectRepository(Salida) private readonly salidas: Repository<Salida>,
    @InjectRepository(Shipment) private readonly shipments: Repository<Shipment>,
  ) {}

  async remainingFor(salidaIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!salidaIds.length) return map;
    const rows = await this.shipments.find({
      where: { salidaId: In(salidaIds), status: In([...LIVE_SHIPMENT_STATUSES]) },
    });
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.salidaId, (counts.get(r.salidaId) || 0) + 1);
    return counts;
  }

  serializeSalida(s: Salida, used: number) {
    const remainingPliegos = Math.max(0, s.capacityPliegos - used);
    const route = s.route;
    return {
      id: s.id,
      routeId: s.routeId,
      dispatchOn: s.dispatchOn,
      capacityPliegos: s.capacityPliegos,
      remainingPliegos,
      status: s.status,
      route: route
        ? {
            id: route.id,
            slug: route.slug,
            name: route.name,
            scope: route.scope,
            priceCents: route.priceCents,
            imageUrl: route.imageUrl,
            caption: route.caption,
            fromPriceCents: route.priceCents,
          }
        : undefined,
    };
  }

  async listRoutes() {
    const items = await this.routes.find({ order: { sortOrder: 'ASC' } });
    const openPrices = items.filter((r) => r.open).map((r) => r.priceCents);
    const fromPriceCents = openPrices.length ? Math.min(...openPrices) : 0;
    return {
      fromPriceCents,
      items: items.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        scope: r.scope,
        blurb: r.blurb,
        imageUrl: r.imageUrl,
        caption: r.caption,
        priceCents: r.priceCents,
        fromPriceCents: r.priceCents,
        open: r.open,
        sortOrder: r.sortOrder,
      })),
    };
  }

  async getRoute(id: string) {
    const r = await this.routes.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Ruta no encontrada');
    const salidas = await this.listSalidas(id);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      scope: r.scope,
      blurb: r.blurb,
      imageUrl: r.imageUrl,
      caption: r.caption,
      priceCents: r.priceCents,
      fromPriceCents: r.priceCents,
      open: r.open,
      salidas: salidas.items,
    };
  }

  async listPapers() {
    const items = await this.papers.find({ order: { name: 'ASC' } });
    return {
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        stock: p.stock,
      })),
    };
  }

  async listSalidas(routeId?: string) {
    const where = routeId ? { routeId } : {};
    const items = await this.salidas.find({
      where,
      relations: { route: true },
      order: { dispatchOn: 'ASC' },
    });
    const used = await this.remainingFor(items.map((s) => s.id));
    return {
      items: items.map((s) => this.serializeSalida(s, used.get(s.id) || 0)),
    };
  }

  async getSalida(id: string) {
    const s = await this.salidas.findOne({ where: { id }, relations: { route: true } });
    if (!s) throw new NotFoundException('Saca no encontrada');
    const used = await this.remainingFor([id]);
    return this.serializeSalida(s, used.get(id) || 0);
  }
}
