import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { BinaryEncodingService } from './encoding.service';
import { RoomsGatewayService } from './rooms-gateway.service';

import { IDLE_SNAPSHOT_QUEUE } from './utils/constants';

import { CacheRedisModule } from '../../core/cache-redis/cache-redis.module';
import { MailerModule } from '../../core/mailer/mailer.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { QueueRedisModule } from '../../core/queue-redis/queue-redis.module';
import { PrometheusModule } from '../../core/prometheus/prometheus.module';

@Module({
  controllers: [RoomsController],
  imports: [
    CacheRedisModule,
    QueueRedisModule,
    DatabaseModule,
    MailerModule,
    AppConfigModule,
    PrometheusModule,
    BullModule.registerQueue({
      name: IDLE_SNAPSHOT_QUEUE,
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
