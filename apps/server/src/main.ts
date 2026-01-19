import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import cookieParser from 'cookie-parser';

import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

import { RedisService } from './core/redis/redis.service';
import { RedisIoAdapter } from './core/redis-io-adapter/redis-io-adapter';

import { PrismaKnownErrorFilter } from './common/filters/prisma-known-error.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      credentials: true,
      origin: [process.env.FRONTEND_URL!],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    bufferLogs: true,
  });

  const redisIoAdapter = new RedisIoAdapter(app.get(RedisService), app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.set('trust proxy', true);
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new PrismaKnownErrorFilter());

  await app.listen(process.env.PORT!);
}
bootstrap();
