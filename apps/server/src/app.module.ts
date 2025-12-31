import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailerModule } from './core/mailer/mailer.module';
import { DatabaseModule } from './core/database/database.module';
import { AppConfigModule } from './core/app-config/app-config.module';

import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { AccountsModule } from './modules/accounts/accounts.module';

@Module({
  imports: [
    RoomsModule,
    ConfigModule.forRoot({ isGlobal: false }),
    AppConfigModule,
    DatabaseModule,
    MailerModule,
    AccountsModule,
    AuthModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
