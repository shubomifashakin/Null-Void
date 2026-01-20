import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CacheRedisModule } from '../../core/cache-redis/cache-redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [DatabaseModule, AppConfigModule, CacheRedisModule],
})
export class AuthModule {}
