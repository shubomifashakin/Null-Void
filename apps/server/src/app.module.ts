import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
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
    LoggerModule.forRoot({
      pinoHttp: {
        messageKey: 'message',
        level: process.env.LOG_LEVEL! || 'info',
        base: { service: process.env.SERVICE_NAME! },
        timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
        transport: {
          targets:
            process.env.NODE_ENV !== 'production'
              ? [{ target: 'pino-pretty' }]
              : [
                  {
                    target: 'pino-roll',
                    level: 'info',
                    options: {
                      file: './logs/combined.log',
                      mkdir: true,
                      size: '2m',
                      frequency: 'daily',
                      limit: { count: 5 },
                      dateFormat: 'dd-MM-yyyy',
                    },
                  },
                  {
                    target: 'pino-roll',
                    level: 'error',
                    options: {
                      file: './logs/errors.log',
                      mkdir: true,
                      size: '2m',
                      frequency: 'daily',
                      limit: { count: 5 },
                      dateFormat: 'dd-MM-yyyy',
                    },
                  },
                ],
        },
        redact: {
          paths: [
            'req.headers',
            'req.header',
            'res.headers',
            'res.header',
            'header',
            'req.query.token',
            'req.query',
            'req.params',
            'req.params.*',
            'req.cookies',
            'req.cookies.*',
            'req.body',
            'res.body',
            'res.data',
            'password',
            '*.*.password',
            '*.password',
            'email',
            '**.email',
            '**[*].email',
            '**[*].*email',
            '**.password',
            '**[*].password',
            '**[*].*password',
            'secret',
            'apiKey',
          ],
          remove: true,
        },
      },
      assignResponse: false,
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
