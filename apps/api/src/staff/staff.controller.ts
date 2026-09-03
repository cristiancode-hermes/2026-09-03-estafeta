import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, StaffGuard } from '../auth/current-user';
import type { AuthUser } from '../auth/current-user';
import { ScanDto, StaffService } from './staff.service';

@ApiTags('staff')
@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Post('staff/scan')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffGuard)
  scan(@CurrentUser() user: AuthUser, @Body() dto: ScanDto) {
    return this.staff.scan(user.userId, dto);
  }

  @Get('staff/today')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffGuard)
  today() {
    return this.staff.today();
  }

  @Get('stats/dispatched')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StaffGuard)
  stats(@Query('days') days?: string) {
    return this.staff.dispatchedStats(Number(days) || 14);
  }
}
