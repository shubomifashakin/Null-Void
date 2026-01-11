import { Module } from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { RoomsEventsService } from './rooms-events.service';

import { RedisModule } from '../../core/redis/redis.module';
import { MailerModule } from '../../core/mailer/mailer.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';

@Module({
  controllers: [RoomsController],
  imports: [RedisModule, DatabaseModule, MailerModule, AppConfigModule],
  providers: [RoomsGateway, RoomsService, RoomsEventsService],
})
export class RoomsModule {}
