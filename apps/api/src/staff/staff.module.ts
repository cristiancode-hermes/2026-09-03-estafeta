import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArrivalsModule } from '../arrivals/arrivals.module';
import { AuthModule } from '../auth/auth.module';
import { Arrival, ScanEvent, Shipment } from '../entities/entities';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Arrival, ScanEvent]), AuthModule, ArrivalsModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
