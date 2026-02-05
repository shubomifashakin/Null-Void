import { Module } from '@nestjs/common';

import { QueueRedisService } from './queue-redis.service';

import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [AppConfigModule],
  providers: [QueueRedisService],
  exports: [QueueRedisService],
})
export class QueueRedisModule {}
