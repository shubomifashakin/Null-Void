import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [AppConfigModule],
  exports: [PrometheusService],
  providers: [PrometheusService],
})
export class PrometheusModule {}
