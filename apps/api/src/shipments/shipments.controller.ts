import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import type { AuthUser } from '../auth/current-user';
import { CheckoutDto, ShipmentsService } from './shipments.service';

class ListQuery {
  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('shipments')
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.shipments.checkout(user.userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser, @Query() q: ListQuery) {
    return this.shipments.mine(user.userId, q.status);
  }

  @Get('by-code/:code')
  byCode(@Param('code') code: string) {
    return this.shipments.byCode(code);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mineOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.shipments.mineOne(user.userId, id);
  }
}
