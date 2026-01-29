import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';

import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

import { QueueRedisService } from './core/queue-redis/queue-redis.service';
import { RedisIoAdapter } from './core/redis-io-adapter/redis-io-adapter';

import { PrismaKnownErrorFilter } from './common/filters/prisma-known-error.filter';
import { AppConfigService } from './core/app-config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      credentials: true,
      origin: [process.env.FRONTEND_URL!],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    bufferLogs: true,
  });

  const redisIoAdapter = new RedisIoAdapter(
    app.get(QueueRedisService),
    app,
    app.get(AppConfigService),
  );
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.set('trust proxy', true);
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api', { exclude: ['health', 'metrics'] });

  const config = new DocumentBuilder()
    .setTitle('Null Void API')
    .setDescription(
      'The api documentation for Null-Void, a website where users can draw and sketch together.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();

  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new PrismaKnownErrorFilter());

  await app.listen(process.env.PORT!);
}
bootstrap();
