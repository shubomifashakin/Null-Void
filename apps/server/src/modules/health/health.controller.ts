import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @Version(VERSION_NEUTRAL)
  getHealth() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
