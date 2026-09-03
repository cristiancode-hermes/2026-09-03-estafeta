import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/current-user';
import {
  AdminService,
  CreateArrivalDto,
  CreatePaperDto,
  CreateRouteDto,
  CreateSalidaDto,
  PatchPaperDto,
  PatchRouteDto,
  PatchSalidaDto,
} from './admin.service';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post('routes')
  createRoute(@Body() dto: CreateRouteDto) {
    return this.admin.createRoute(dto);
  }

  @Patch('routes/:id')
  patchRoute(@Param('id') id: string, @Body() dto: PatchRouteDto) {
    return this.admin.patchRoute(id, dto);
  }

  @Post('salidas')
  createSalida(@Body() dto: CreateSalidaDto) {
    return this.admin.createSalida(dto);
  }

  @Patch('salidas/:id')
  patchSalida(@Param('id') id: string, @Body() dto: PatchSalidaDto) {
    return this.admin.patchSalida(id, dto);
  }

  @Post('papers')
  createPaper(@Body() dto: CreatePaperDto) {
    return this.admin.createPaper(dto);
  }

  @Patch('papers/:id')
  patchPaper(@Param('id') id: string, @Body() dto: PatchPaperDto) {
    return this.admin.patchPaper(id, dto);
  }

  @Post('arrivals')
  createArrival(@Body() dto: CreateArrivalDto) {
    return this.admin.createArrival(dto);
  }
}
