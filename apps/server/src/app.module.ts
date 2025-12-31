import { Module } from '@nestjs/common';
import { RoomsModule } from './modules/rooms/rooms.module';
@Module({
  imports: [RoomsModule],
  providers: [],
  controllers: [],
})
export class AppModule {}
