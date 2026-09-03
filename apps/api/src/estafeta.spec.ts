import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  ALL_ENTITIES,
  Arrival,
  Paper,
  Route,
  Salida,
  ScanEvent,
  Shipment,
  ShipmentLine,
  User,
} from './entities/entities';
import { AuthService } from './auth/auth.service';
import { CatalogService } from './catalog/catalog.service';
import { ShipmentsService } from './shipments/shipments.service';
import { ArrivalsService } from './arrivals/arrivals.service';
import { StaffService } from './staff/staff.service';
import { addDaysIso, madridToday } from './util/madrid';
import { makeQr } from './util/qr';

describe('Estafeta', () => {
  let app: INestApplication;
  let users: Repository<User>;
  let routes: Repository<Route>;
  let papers: Repository<Paper>;
  let salidas: Repository<Salida>;
  let shipments: Repository<Shipment>;
  let lines: Repository<ShipmentLine>;
  let arrivals: Repository<Arrival>;
  let auth: AuthService;
  let catalog: CatalogService;
  let shipSvc: ShipmentsService;
  let arrSvc: ArrivalsService;
  let staff: StaffService;
  let demo: User;
  let other: User;
  let staffUser: User;
  let local: Route;
  let kraft: Paper;
  let openBag: Salida;
  let fullBag: Salida;
  let closedBag: Salida;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true,
        } as any),
        TypeOrmModule.forFeature(ALL_ENTITIES),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '7d' } }),
      ],
      providers: [AuthService, CatalogService, ShipmentsService, ArrivalsService, StaffService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    users = moduleRef.get(getRepositoryToken(User));
    routes = moduleRef.get(getRepositoryToken(Route));
    papers = moduleRef.get(getRepositoryToken(Paper));
    salidas = moduleRef.get(getRepositoryToken(Salida));
    shipments = moduleRef.get(getRepositoryToken(Shipment));
    lines = moduleRef.get(getRepositoryToken(ShipmentLine));
    arrivals = moduleRef.get(getRepositoryToken(Arrival));
    auth = moduleRef.get(AuthService);
    catalog = moduleRef.get(CatalogService);
    shipSvc = moduleRef.get(ShipmentsService);
    arrSvc = moduleRef.get(ArrivalsService);
    staff = moduleRef.get(StaffService);

    const hash = await bcrypt.hash('demo1234', 4);
    const now = new Date();
    demo = (await users.save({
      username: 'demo',
      email: 'demo@estafeta.dev',
      passwordHash: hash,
      role: 'customer',
      displayName: 'Demo',
      createdAt: now,
    } as any)) as User;
    other = (await users.save({
      username: 'otro',
      email: 'otro@estafeta.dev',
      passwordHash: hash,
      role: 'customer',
      displayName: 'Otro',
      createdAt: now,
    } as any)) as User;
    staffUser = (await users.save({
      username: 'staff',
      email: 'staff@estafeta.dev',
      passwordHash: hash,
      role: 'staff',
      displayName: 'Staff',
      createdAt: now,
    } as any)) as User;

    local = (await routes.save({
      slug: 'local',
      name: 'Saca local',
      scope: 'local',
      blurb: 'Barrio',
      imageUrl: '/assets/casilleros.svg',
      caption: 'Casilleros',
      priceCents: 250,
      open: true,
      sortOrder: 1,
    } as any)) as Route;
    await routes.save({
      slug: 'comarca',
      name: 'Saca comarca',
      scope: 'comarca',
      blurb: 'Valle',
      imageUrl: '/assets/mostrador.svg',
      caption: 'Mostrador',
      priceCents: 450,
      open: true,
      sortOrder: 2,
    } as any);

    kraft = (await papers.save({ name: 'Sobre kraft', priceCents: 80, stock: 12 } as any)) as Paper;
    await papers.save({ name: 'Cartulina agotada', priceCents: 120, stock: 0 } as any);

    const d1 = addDaysIso(madridToday(), 1);
    openBag = (await salidas.save({
      routeId: local.id,
      dispatchOn: d1,
      capacityPliegos: 3,
      status: 'open',
    } as any)) as Salida;
    fullBag = (await salidas.save({
      routeId: local.id,
      dispatchOn: addDaysIso(madridToday(), 2),
      capacityPliegos: 1,
      status: 'open',
    } as any)) as Salida;
    closedBag = (await salidas.save({
      routeId: local.id,
      dispatchOn: addDaysIso(madridToday(), 3),
      capacityPliegos: 4,
      status: 'closed',
    } as any)) as Salida;
  });

  afterAll(async () => {
    await app.close();
  });

  it('login acepta email o username', async () => {
    const a = await auth.login({ identifier: 'demo@estafeta.dev', password: 'demo1234' });
    const b = await auth.login({ identifier: 'demo', password: 'demo1234' });
    expect(a.accessToken).toBeTruthy();
    expect(b.user.email).toBe('demo@estafeta.dev');
  });

  it('desde = min(priceCents) de rutas abiertas', async () => {
    const list = await catalog.listRoutes();
    expect(list.fromPriceCents).toBe(250);
    expect(list.items[0].fromPriceCents).toBe(list.items[0].priceCents);
  });

  it('remainingPliegos lista = detalle', async () => {
    const list = await catalog.listSalidas(local.id);
    const one = await catalog.getSalida(openBag.id);
    const listed = list.items.find((s) => s.id === openBag.id)!;
    expect(listed.remainingPliegos).toBe(one.remainingPliegos);
    expect(listed.remainingPliegos).toBe(3);
  });

  it('checkout cobra y deja QR con URL absoluta', async () => {
    const sh = await shipSvc.checkout(demo.id, { salidaId: openBag.id, paperId: kraft.id });
    expect(sh.status).toBe('confirmed');
    expect(sh.totalCents).toBe(330);
    expect(sh.qrUrl).toContain('/envio/');
    expect(sh.qrSvg).toContain(sh.qrUrl);
    expect(sh.qrSvg).toContain('<svg');
    const paper = await papers.findOne({ where: { id: kraft.id } });
    expect(paper!.stock).toBe(11);
  });

  it('ALREADY_IN_BAG 409 si el mismo user recompra la saca', async () => {
    await expect(shipSvc.checkout(demo.id, { salidaId: openBag.id })).rejects.toMatchObject({
      status: 409,
      response: { code: 'ALREADY_IN_BAG' },
    });
  });

  it('lista y detalle suman las mismas líneas', async () => {
    const mine = await shipSvc.mine(demo.id);
    const one = mine.items[0];
    const sum = one.lines.reduce((a, l) => a + l.subtotalCents, 0);
    expect(sum).toBe(one.totalCents);
    expect(mine.totalCentsSum).toBe(one.totalCents);
  });

  it('BAG_FULL 409 cuando no queda cupo', async () => {
    await shipSvc.checkout(other.id, { salidaId: fullBag.id });
    const ghost = (await users.save({
      username: 'ghost',
      email: 'ghost@estafeta.dev',
      passwordHash: demo.passwordHash,
      role: 'customer',
      displayName: 'Ghost',
      createdAt: new Date(),
    } as any)) as User;
    await expect(shipSvc.checkout(ghost.id, { salidaId: fullBag.id })).rejects.toMatchObject({
      status: 409,
      response: { code: 'BAG_FULL' },
    });
  });

  it('SALIDA_CLOSED 409', async () => {
    await expect(shipSvc.checkout(other.id, { salidaId: closedBag.id })).rejects.toMatchObject({
      status: 409,
      response: { code: 'SALIDA_CLOSED' },
    });
  });

  it('NO_PAPER 409 si stock 0', async () => {
    const empty = await papers.findOne({ where: { name: 'Cartulina agotada' } });
    const extra = (await salidas.save({
      routeId: local.id,
      dispatchOn: addDaysIso(madridToday(), 8),
      capacityPliegos: 4,
      status: 'open',
    } as any)) as Salida;
    await expect(
      shipSvc.checkout(other.id, { salidaId: extra.id, paperId: empty!.id }),
    ).rejects.toMatchObject({ status: 409, response: { code: 'NO_PAPER' } });
  });

  it('GET público by-code 200 y contiene URL', async () => {
    const mine = await shipSvc.mine(demo.id);
    const pub = await shipSvc.byCode(mine.items[0].code);
    expect(pub.qrSvg).toContain(pub.qrUrl);
  });

  it('puntos derivados de dispatched, no de confirmed', async () => {
    const before = await auth.derivedPoints(demo.id);
    expect(before).toBe(0);
    const mine = await shipSvc.mine(demo.id);
    await staff.scan(staffUser.id, { codeOrUrl: mine.items[0].code, action: 'drop', voice: 'staff' });
    await staff.scan(staffUser.id, { codeOrUrl: mine.items[0].qrUrl!, action: 'dispatch', voice: 'staff' });
    const after = await auth.derivedPoints(demo.id);
    expect(after).toBe(1);
  });

  it('scan drop duplicado 409 ALREADY_DROPPED', async () => {
    const extra = (await salidas.save({
      routeId: local.id,
      dispatchOn: addDaysIso(madridToday(), 9),
      capacityPliegos: 2,
      status: 'open',
    } as any)) as Salida;
    const sh = await shipSvc.checkout(other.id, { salidaId: extra.id });
    await staff.scan(staffUser.id, { codeOrUrl: sh.code, action: 'drop' });
    await expect(staff.scan(staffUser.id, { codeOrUrl: sh.code, action: 'drop' })).rejects.toMatchObject({
      status: 409,
      response: { code: 'ALREADY_DROPPED' },
    });
  });

  it('QR makeQr incrusta la URL', async () => {
    const url = 'https://estafeta.proyectos.cristiancode.dev/envio/ABC12345';
    const qr = await makeQr(url);
    expect(qr.qrSvg).toContain(url);
  });

  it('sweeper marca llegadas vencidas', async () => {
    const qr = await makeQr('https://estafeta.proyectos.cristiancode.dev/llegada/EXPIRED1');
    await arrivals.save({
      userId: demo.id,
      code: 'EXPIRED1',
      senderLabel: 'Tía',
      status: 'arrived',
      qrSvg: qr.qrSvg,
      qrUrl: qr.qrUrl,
      pickupExpiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    } as any);
    const n = await arrSvc.expireStale();
    expect(n).toBeGreaterThanOrEqual(1);
    const row = await arrivals.findOne({ where: { code: 'EXPIRED1' } });
    expect(row!.status).toBe('expired');
  });

  it('stats 14 días rellenan ceros', async () => {
    const stats = await staff.dispatchedStats(14);
    expect(stats.points).toHaveLength(14);
    expect(stats.points[0]).toHaveProperty('date');
    expect(stats.points[0]).toHaveProperty('value');
  });

  it('remaining baja 1 tras checkout', async () => {
    const before = await catalog.getSalida(openBag.id);
    expect(before.remainingPliegos).toBe(2);
  });

  it('líneas seed-like coinciden con totalCents', async () => {
    const all = await shipments.find();
    for (const s of all) {
      const ls = await lines.find({ where: { shipmentId: s.id } });
      const sum = ls.reduce((a, l) => a + l.subtotalCents, 0);
      expect(sum).toBe(s.totalCents);
    }
  });
});
