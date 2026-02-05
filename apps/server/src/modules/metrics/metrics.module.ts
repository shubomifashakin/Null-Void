import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { PrometheusModule } from '../../core/prometheus/prometheus.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';

@Module({
  imports: [PrometheusModule, AppConfigModule],
  controllers: [MetricsController],
})
export class MetricsModule {}
