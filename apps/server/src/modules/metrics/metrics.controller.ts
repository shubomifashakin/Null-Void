import { type Response } from 'express';
import { ApiResponse } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Res,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { PrometheusService } from '../../core/prometheus/prometheus.service';
import { MetricsAuthGuard } from './guards/auth.guard';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  @UseGuards(MetricsAuthGuard)
  @Version(VERSION_NEUTRAL)
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics(@Res() res: Response) {
    const contentType = this.prometheusService.getContentType();
    const metrics = await this.prometheusService.getMetrics();

    res.setHeader('Content-Type', contentType);
    res.send(metrics);
  }
}
