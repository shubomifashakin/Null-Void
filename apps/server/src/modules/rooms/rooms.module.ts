import { Module } from '@nestjs/common';

import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  providers: [RoomsGateway, RoomsService],
  exports: [RoomsGateway],
  controllers: [RoomsController],
})
export class RoomsModule {}
