import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArrivalsModule } from '../arrivals/arrivals.module';
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
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Route,
      Paper,
      Salida,
      Shipment,
      ShipmentLine,
      Arrival,
      ScanEvent,
    ]),
    ArrivalsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
