import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailerModule } from './core/mailer/mailer.module';
import { RedisModule } from './core/redis/redis.module';
import { DatabaseModule } from './core/database/database.module';
import { AppConfigModule } from './core/app-config/app-config.module';

import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { validateConfig } from './common/utils';

@Module({
  imports: [
    RoomsModule,
    ConfigModule.forRoot({
      isGlobal: false,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validate(config) {
        validateConfig(config);

        return config;
      },
    }),
    AppConfigModule,
    DatabaseModule,
    MailerModule,
    AccountsModule,
    AuthModule,
    RedisModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
