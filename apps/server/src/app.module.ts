import { Request } from 'express';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { MailerModule } from './core/mailer/mailer.module';
import { CacheRedisModule } from './core/cache-redis/cache-redis.module';
import { QueueRedisModule } from './core/queue-redis/queue-redis.module';
import { DatabaseModule } from './core/database/database.module';
import { AppConfigModule } from './core/app-config/app-config.module';
import { AppConfigService } from './core/app-config/app-config.service';
import { CacheRedisService } from './core/cache-redis/cache-redis.service';

import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { HealthModule } from './modules/health/health.module';
import { AccountsModule } from './modules/accounts/accounts.module';

import { validateConfig } from './common/utils';
import { DEFAULT_JWT_ALG } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validate(config) {
        validateConfig(config);

        return config;
      },
    }),
    AppConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        messageKey: 'message',
        errorKey: 'error',
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
        genReqId: (req: Request) => {
          return (
            req?.requestId ||
            req.headers['x-request-id'] ||
            req.headers['X-Request-Id'] ||
            Date.now().toString()
          );
        },
      },
      assignResponse: false,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [AppConfigModule],
      useFactory: (configService: AppConfigService) => {
        return {
          signOptions: {
            expiresIn: '10m',
            algorithm: DEFAULT_JWT_ALG,
          },
          verifyOptions: {
            algorithms: [DEFAULT_JWT_ALG],
          },
          secretOrKeyProvider() {
            return configService.JWT_SECRET.data!;
          },
          secret: configService.JWT_SECRET.data!,
          privateKey: configService.JWT_SECRET.data!,
          publicKey: configService.JWT_PUBLIC_KEY.data!,
        };
      },
      inject: [AppConfigService],
    }),
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => {
        return {
          connection: {
            connectionName: 'bull',
            maxRetriesPerRequest: 2,
            url: configService.QUEUE_REDIS_URL.data!,
          },
          defaultJobOptions: {
            attempts: 4,
            delay: 1000,
            removeOnComplete: true,
            backoff: {
              jitter: 1,
              delay: 1000,
              type: 'exponential',
            },
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [CacheRedisModule],
      inject: [CacheRedisService],
      useFactory: (cache: CacheRedisService) => {
        return {
          throttlers: [
            {
              ttl: 10,
              limit: 10,
              name: 'default',
            },
          ],
          errorMessage: 'Too many requests',
          generateKey: (ctx, _, throttlerName) => {
            const req = ctx.switchToHttp().getRequest<Request>();
            const key =
              req?.user?.id || req?.ip || req?.ips?.[0] || 'unknown-ip';

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const route = req.route?.path || req.path;

            return `${throttlerName}:${route}:${key}`.toLowerCase();
          },

          storage: {
            async increment(key, ttl, limit, blockDuration) {
              return await cache.increment(key, ttl, limit, blockDuration);
            },
          },
        };
      },
    }),
    RoomsModule,
    DatabaseModule,
    MailerModule,
    AccountsModule,
    AuthModule,
    HealthModule,
    CacheRedisModule,
    QueueRedisModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  controllers: [],
})
export class AppModule {}
