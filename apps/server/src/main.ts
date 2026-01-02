import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      credentials: true,
      origin: [process.env.FRONTEND_URL!],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.set('trust proxy', true);
  app.setGlobalPrefix('/api/v1');
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT!);
}
bootstrap();
