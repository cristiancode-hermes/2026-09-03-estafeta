import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ type: 'varchar', nullable: true })
  displayName: string | null;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => Shipment, (s) => s.user)
  shipments?: Shipment[];

  @OneToMany(() => Arrival, (a) => a.user)
  arrivals?: Arrival[];
}

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  scope: string;

  @Column({ type: 'text', nullable: true })
  blurb: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  caption: string | null;

  @Column({ type: 'int' })
  priceCents: number;

  @Column({ type: 'boolean', default: true })
  open: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => Salida, (s) => s.route)
  salidas?: Salida[];
}

@Entity('papers')
export class Paper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  priceCents: number;

  @Column({ type: 'int' })
  stock: number;
}

@Entity('salidas')
@Index(['routeId', 'dispatchOn'], { unique: true })
export class Salida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  routeId: string;

  @ManyToOne(() => Route, (r) => r.salidas)
  route?: Route;

  @Column({ type: 'date' })
  dispatchOn: string;

  @Column({ type: 'int' })
  capacityPliegos: number;

  @Column({ type: 'varchar' })
  status: string;

  @OneToMany(() => Shipment, (s) => s.salida)
  shipments?: Shipment[];
}

export const LIVE_SHIPMENT = ['confirmed', 'dropped', 'dispatched'] as const;

@Entity('shipments')
@Index(['userId', 'salidaId'])
@Index(['salidaId', 'status'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, (u) => u.shipments)
  user?: User;

  @Column({ type: 'varchar' })
  routeId: string;

  @ManyToOne(() => Route)
  route?: Route;

  @Column({ type: 'varchar' })
  salidaId: string;

  @ManyToOne(() => Salida, (s) => s.shipments)
  salida?: Salida;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'int' })
  totalCents: number;

  @Column({ type: 'text', nullable: true })
  qrSvg: string | null;

  @Column({ type: 'varchar', nullable: true })
  qrUrl: string | null;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => ShipmentLine, (l) => l.shipment)
  lines?: ShipmentLine[];
}

@Entity('shipment_lines')
export class ShipmentLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  shipmentId: string;

  @ManyToOne(() => Shipment, (s) => s.lines)
  shipment?: Shipment;

  @Column({ type: 'varchar' })
  kind: string;

  @Column({ type: 'varchar', nullable: true })
  paperId: string | null;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'int' })
  unitCents: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'int' })
  subtotalCents: number;
}

@Entity('arrivals')
export class Arrival {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, (u) => u.arrivals)
  user?: User;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  senderLabel: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'text', nullable: true })
  qrSvg: string | null;

  @Column({ type: 'varchar', nullable: true })
  qrUrl: string | null;

  @Column({ type: 'datetime' })
  pickupExpiresAt: Date;

  @Column({ type: 'datetime' })
  createdAt: Date;
}

@Entity('scan_events')
export class ScanEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  staffUserId: string;

  @Column({ type: 'varchar', nullable: true })
  shipmentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  arrivalId: string | null;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'varchar' })
  voice: string;

  @Column({ type: 'datetime' })
  createdAt: Date;
}

export const ALL_ENTITIES = [
  User,
  Route,
  Paper,
  Salida,
  Shipment,
  ShipmentLine,
  Arrival,
  ScanEvent,
];
