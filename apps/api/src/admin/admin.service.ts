import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Repository } from 'typeorm';
import { Arrival, Paper, Route, Salida, User } from '../entities/entities';
import { makeQr } from '../util/qr';
import { pliegoCode, webOrigin } from '../util/madrid';

export class CreateRouteDto {
  @IsString() name!: string;
  @IsString() scope!: string;
  @IsInt() @Min(0) priceCents!: number;
  @IsOptional() @IsString() blurb?: string;
  @IsOptional() @IsString() slug?: string;
}

export class PatchRouteDto {
  @IsOptional() @IsBoolean() open?: boolean;
  @IsOptional() @IsInt() @Min(0) priceCents?: number;
}

export class CreateSalidaDto {
  @IsString() routeId!: string;
  @IsString() dispatchOn!: string;
  @IsInt() @Min(1) capacityPliegos!: number;
}

export class PatchSalidaDto {
  @IsString() status!: string;
}

export class CreatePaperDto {
  @IsString() name!: string;
  @IsInt() @Min(0) priceCents!: number;
  @IsInt() @Min(0) stock!: number;
}

export class PatchPaperDto {
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(0) priceCents?: number;
}

export class CreateArrivalDto {
  @IsString() userId!: string;
  @IsString() senderLabel!: string;
  @IsOptional() @IsInt() @Min(1) pickupHours?: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Route) private readonly routes: Repository<Route>,
    @InjectRepository(Salida) private readonly salidas: Repository<Salida>,
    @InjectRepository(Paper) private readonly papers: Repository<Paper>,
    @InjectRepository(Arrival) private readonly arrivals: Repository<Arrival>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createRoute(dto: CreateRouteDto) {
    const slug = (dto.slug || dto.scope || dto.name).toLowerCase().replace(/\s+/g, '-');
    return (await this.routes.save({
      slug,
      name: dto.name,
      scope: dto.scope,
      blurb: dto.blurb || null,
      imageUrl: '/assets/mostrador.svg',
      caption: dto.name,
      priceCents: dto.priceCents,
      open: true,
      sortOrder: 99,
    } as any)) as Route;
  }

  async patchRoute(id: string, dto: PatchRouteDto) {
    const r = await this.routes.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Ruta no encontrada');
    if (typeof dto.open === 'boolean') r.open = dto.open;
    if (typeof dto.priceCents === 'number') r.priceCents = dto.priceCents;
    return this.routes.save(r);
  }

  async createSalida(dto: CreateSalidaDto) {
    return (await this.salidas.save({
      routeId: dto.routeId,
      dispatchOn: dto.dispatchOn,
      capacityPliegos: dto.capacityPliegos,
      status: 'open',
    } as any)) as Salida;
  }

  async patchSalida(id: string, dto: PatchSalidaDto) {
    const s = await this.salidas.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Saca no encontrada');
    s.status = dto.status;
    return this.salidas.save(s);
  }

  async createPaper(dto: CreatePaperDto) {
    return (await this.papers.save({
      name: dto.name,
      priceCents: dto.priceCents,
      stock: dto.stock,
    } as any)) as Paper;
  }

  async patchPaper(id: string, dto: PatchPaperDto) {
    const p = await this.papers.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Papel no encontrado');
    if (typeof dto.stock === 'number') p.stock = dto.stock;
    if (typeof dto.priceCents === 'number') p.priceCents = dto.priceCents;
    return this.papers.save(p);
  }

  async createArrival(dto: CreateArrivalDto) {
    const user = await this.users.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Vecino no encontrado');
    const hours = dto.pickupHours ?? 72;
    const code = pliegoCode();
    const qrUrl = `${webOrigin()}/llegada/${code}`;
    const qr = await makeQr(qrUrl);
    const now = new Date();
    const pickupExpiresAt = new Date(now.getTime() + hours * 3600 * 1000);
    return (await this.arrivals.save({
      userId: user.id,
      code,
      senderLabel: dto.senderLabel,
      status: 'arrived',
      qrSvg: qr.qrSvg,
      qrUrl: qr.qrUrl,
      pickupExpiresAt,
      createdAt: now,
    } as any)) as Arrival;
  }
}
