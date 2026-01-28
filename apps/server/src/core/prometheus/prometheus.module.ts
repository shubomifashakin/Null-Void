import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';

@Module({
  exports: [PrometheusService],
  providers: [PrometheusService],
})
export class PrometheusModule {}
