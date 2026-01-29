import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  @Get()
  @ApiResponse({ status: 200, description: 'Health check' })
  @Version(VERSION_NEUTRAL)
  getHealth() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
