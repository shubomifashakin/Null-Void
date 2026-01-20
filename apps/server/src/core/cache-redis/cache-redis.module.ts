import { Module } from '@nestjs/common';
import { CacheRedisService } from './cache-redis.service';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [AppConfigModule],
  providers: [CacheRedisService],
  exports: [CacheRedisService],
})
export class CacheRedisModule {}
