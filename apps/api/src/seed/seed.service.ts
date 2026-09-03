import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  Arrival,
  Paper,
  Route,
  Salida,
  ScanEvent,
  Shipment,
  ShipmentLine,
  User,
} from '../entities/entities';
import { ArrivalsService } from '../arrivals/arrivals.service';
import { makeQr } from '../util/qr';
import { addDaysIso, madridToday, pliegoCode, webOrigin } from '../util/madrid';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly log = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Route) private readonly routes: Repository<Route>,
    @InjectRepository(Paper) private readonly papers: Repository<Paper>,
    @InjectRepository(Salida) private readonly salidas: Repository<Salida>,
    @InjectRepository(Shipment) private readonly shipments: Repository<Shipment>,
    @InjectRepository(ShipmentLine) private readonly lines: Repository<ShipmentLine>,
    @InjectRepository(Arrival) private readonly arrivals: Repository<Arrival>,
    @InjectRepository(ScanEvent) private readonly scans: Repository<ScanEvent>,
    private readonly arrivalsSvc: ArrivalsService,
  ) {}

  async onModuleInit() {
    await this.seed();
    setInterval(() => {
      this.arrivalsSvc.expireStale().catch((err) => this.log.warn(err));
    }, 30_000);
  }

  private async saveUser(def: Partial<User> & { password: string }) {
    const passwordHash = await bcrypt.hash(def.password, 10);
    return (await this.users.save({
      username: def.username,
      email: def.email,
      passwordHash,
      role: def.role,
      displayName: def.displayName,
      createdAt: def.createdAt || new Date(),
    } as any)) as User;
  }

  async seed() {
    if (await this.users.count()) return;

    const hashNow = new Date();
    const demo = await this.saveUser({
      username: 'demo',
      email: 'demo@estafeta.dev',
      password: 'demo1234',
      role: 'customer',
      displayName: 'Nuria Vecina',
      createdAt: hashNow,
    });
    await this.saveUser({
      username: 'staff',
      email: 'staff@estafeta.dev',
      password: 'demo1234',
      role: 'staff',
      displayName: 'Toni Mostrador',
      createdAt: hashNow,
    });
    await this.saveUser({
      username: 'admin',
      email: 'admin@estafeta.dev',
      password: 'demo1234',
      role: 'admin',
      displayName: 'Administración',
      createdAt: hashNow,
    });
    const filler = await this.saveUser({
      username: 'vecino2',
      email: 'vecino2@estafeta.dev',
      password: 'demo1234',
      role: 'customer',
      displayName: 'Paco Filler',
      createdAt: hashNow,
    });

    const routeDefs = [
      {
        slug: 'local',
        name: 'Saca local',
        scope: 'local',
        blurb: 'El barrio y las calles de al lado. Sale al mediodía.',
        imageUrl: '/assets/casilleros.svg',
        caption: 'Casilleros del mostrador',
        priceCents: 250,
        sortOrder: 1,
      },
      {
        slug: 'comarca',
        name: 'Saca comarca',
        scope: 'comarca',
        blurb: 'Pueblos del valle. Una saca por día laborable.',
        imageUrl: '/assets/mostrador.svg',
        caption: 'Mostrador de lacre',
        priceCents: 450,
        sortOrder: 2,
      },
      {
        slug: 'nacional',
        name: 'Saca nacional',
        scope: 'nacional',
        blurb: 'Península. El pliego viaja con el resto de la bolsa.',
        imageUrl: '/assets/lacre.svg',
        caption: 'Lacre de estafeta',
        priceCents: 790,
        sortOrder: 3,
      },
      {
        slug: 'ultramar',
        name: 'Saca ultramar',
        scope: 'ultramar',
        blurb: 'Islas y más allá. Cupo corto, papel grueso recomendado.',
        imageUrl: '/assets/ultramar.svg',
        caption: 'Saca de ultramar',
        priceCents: 1450,
        sortOrder: 4,
      },
    ];
    const routes: Route[] = [];
    for (const def of routeDefs) {
      routes.push(
        (await this.routes.save({ ...def, open: true } as any)) as Route,
      );
    }

    const kraft = (await this.papers.save({
      name: 'Sobre kraft',
      priceCents: 80,
      stock: 12,
    } as any)) as Paper;
    await this.papers.save({ name: 'Cartulina agotada', priceCents: 120, stock: 0 } as any);

    const today = madridToday();
    const d1 = addDaysIso(today, 1);
    const d2 = addDaysIso(today, 2);
    const past = addDaysIso(today, -3);

    const openBag = (await this.salidas.save({
      routeId: routes[0].id,
      dispatchOn: d1,
      capacityPliegos: 8,
      status: 'open',
    } as any)) as Salida;
    const fullBag = (await this.salidas.save({
      routeId: routes[1].id,
      dispatchOn: d1,
      capacityPliegos: 1,
      status: 'open',
    } as any)) as Salida;
    await this.salidas.save({
      routeId: routes[2].id,
      dispatchOn: d2,
      capacityPliegos: 6,
      status: 'closed',
    } as any);
    const pastBag = (await this.salidas.save({
      routeId: routes[0].id,
      dispatchOn: past,
      capacityPliegos: 8,
      status: 'dispatched',
    } as any)) as Salida;

    await this.makeShipment({
      userId: filler.id,
      route: routes[1],
      salida: fullBag,
      status: 'confirmed',
      paper: null,
      createdAt: hashNow,
    });

    await this.makeShipment({
      userId: demo.id,
      route: routes[0],
      salida: openBag,
      status: 'confirmed',
      paper: kraft,
      createdAt: hashNow,
    });

    const dispatchedAt = new Date(hashNow.getTime() - 2 * 86400 * 1000);
    const dispatched = await this.makeShipment({
      userId: demo.id,
      route: routes[0],
      salida: pastBag,
      status: 'dispatched',
      paper: null,
      createdAt: dispatchedAt,
    });
    await this.scans.save({
      staffUserId: (await this.users.findOne({ where: { email: 'staff@estafeta.dev' } }))!.id,
      shipmentId: dispatched.id,
      arrivalId: null,
      action: 'dispatch',
      voice: 'staff',
      createdAt: dispatchedAt,
    } as any);

    const liveCode = pliegoCode();
    const liveQr = await makeQr(`${webOrigin()}/llegada/${liveCode}`);
    await this.arrivals.save({
      userId: demo.id,
      code: liveCode,
      senderLabel: 'Tía Carmen (Valencia)',
      status: 'arrived',
      qrSvg: liveQr.qrSvg,
      qrUrl: liveQr.qrUrl,
      pickupExpiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      createdAt: hashNow,
    } as any);

    const staleCode = pliegoCode();
    const staleQr = await makeQr(`${webOrigin()}/llegada/${staleCode}`);
    await this.arrivals.save({
      userId: demo.id,
      code: staleCode,
      senderLabel: 'Primo de Alcoy',
      status: 'arrived',
      qrSvg: staleQr.qrSvg,
      qrUrl: staleQr.qrUrl,
      pickupExpiresAt: new Date(Date.now() - 3600 * 1000),
      createdAt: new Date(Date.now() - 4 * 86400 * 1000),
    } as any);

    this.log.log('Estafeta seed listo');
  }

  private async makeShipment(opts: {
    userId: string;
    route: Route;
    salida: Salida;
    status: string;
    paper: Paper | null;
    createdAt: Date;
  }) {
    const code = pliegoCode();
    const qrUrl = `${webOrigin()}/envio/${code}`;
    const qr = await makeQr(qrUrl);
    const totalCents = opts.route.priceCents + (opts.paper ? opts.paper.priceCents : 0);
    const sh = (await this.shipments.save({
      userId: opts.userId,
      routeId: opts.route.id,
      salidaId: opts.salida.id,
      code,
      status: opts.status,
      totalCents,
      qrSvg: qr.qrSvg,
      qrUrl: qr.qrUrl,
      createdAt: opts.createdAt,
    } as any)) as Shipment;
    await this.lines.save({
      shipmentId: sh.id,
      kind: 'route',
      paperId: null,
      label: `Ruta ${opts.route.name}`,
      unitCents: opts.route.priceCents,
      qty: 1,
      subtotalCents: opts.route.priceCents,
    } as any);
    if (opts.paper) {
      await this.lines.save({
        shipmentId: sh.id,
        kind: 'paper',
        paperId: opts.paper.id,
        label: opts.paper.name,
        unitCents: opts.paper.priceCents,
        qty: 1,
        subtotalCents: opts.paper.priceCents,
      } as any);
    }
    return sh;
  }
}
