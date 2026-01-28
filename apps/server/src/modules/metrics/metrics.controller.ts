import { type Response } from 'express';
import { Controller, Get, Res, Version, VERSION_NEUTRAL } from '@nestjs/common';

import { PrometheusService } from '../../core/prometheus/prometheus.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Get()
  @Version(VERSION_NEUTRAL)
  async getMetrics(@Res() res: Response) {
    const contentType = this.prometheusService.getContentType();
    const metrics = await this.prometheusService.getMetrics();

    res.setHeader('Content-Type', contentType);
    res.send(metrics);
  }
}
