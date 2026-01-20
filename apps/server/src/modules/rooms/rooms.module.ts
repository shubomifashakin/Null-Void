import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { BinaryEncodingService } from './encoding.service';
import { RoomsGatewayService } from './rooms-gateway.service';

import { RedisModule } from '../../core/redis/redis.module';
import { MailerModule } from '../../core/mailer/mailer.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { QueueRedisModule } from '../../core/queue-redis/queue-redis.module';

@Module({
  controllers: [RoomsController],
  imports: [
    RedisModule,
    QueueRedisModule,
    DatabaseModule,
    MailerModule,
    AppConfigModule,
    BullModule.registerQueue({
      name: 'rooms',
    }),
  ],
  providers: [
    RoomsGateway,
    RoomsService,
    RoomsGatewayService,
    BinaryEncodingService,
  ],
})
export class RoomsModule {}
