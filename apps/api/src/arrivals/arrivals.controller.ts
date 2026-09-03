import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import type { AuthUser } from '../auth/current-user';
import { ArrivalsService } from './arrivals.service';

@ApiTags('arrivals')
@Controller('arrivals')
export class ArrivalsController {
  constructor(private readonly arrivals: ArrivalsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.arrivals.mine(user.userId);
  }

  @Get('by-code/:code')
  byCode(@Param('code') code: string) {
    return this.arrivals.byCode(code);
  }
}
