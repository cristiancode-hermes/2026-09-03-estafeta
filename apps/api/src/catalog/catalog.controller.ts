import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CatalogService } from './catalog.service';

class SalidasQuery {
  @IsOptional()
  @IsString()
  routeId?: string;
}

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('routes')
  listRoutes() {
    return this.catalog.listRoutes();
  }

  @Get('routes/:id')
  getRoute(@Param('id') id: string) {
    return this.catalog.getRoute(id);
  }

  @Get('papers')
  listPapers() {
    return this.catalog.listPapers();
  }

  @Get('salidas')
  listSalidas(@Query() q: SalidasQuery) {
    return this.catalog.listSalidas(q.routeId);
  }

  @Get('salidas/:id')
  getSalida(@Param('id') id: string) {
    return this.catalog.getSalida(id);
  }
}
