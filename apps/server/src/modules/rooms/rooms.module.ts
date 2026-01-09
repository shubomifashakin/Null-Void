import { Module } from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';

import { RedisModule } from '../../core/redis/redis.module';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  controllers: [RoomsController],
  imports: [RedisModule, DatabaseModule],
  providers: [RoomsGateway, RoomsService],
})
export class RoomsModule {}
