import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Arrival } from '../entities/entities';
import { ArrivalsController } from './arrivals.controller';
import { ArrivalsService } from './arrivals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Arrival]), AuthModule],
  controllers: [ArrivalsController],
  providers: [ArrivalsService],
  exports: [ArrivalsService],
})
export class ArrivalsModule {}
