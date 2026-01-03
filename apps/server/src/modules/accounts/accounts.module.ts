import { Module } from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { DatabaseModule } from '../../core/database/database.module';

import { RedisModule } from '../../core/redis/redis.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';

@Module({
  providers: [AccountsService],
  controllers: [AccountsController],
  imports: [DatabaseModule, RedisModule, AppConfigModule],
})
export class AccountsModule {}
