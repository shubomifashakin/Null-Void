import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisModule } from '../../core/redis/redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { AppConfigService } from '../../core/app-config/app-config.service';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    DatabaseModule,
    AppConfigModule,
    RedisModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      imports: [AppConfigModule],
      useFactory: (appConfigService: AppConfigService) => {
        if (
          !appConfigService.JWT_SECRET.success ||
          !appConfigService.BASE_URL.success
        ) {
          throw new Error(
            appConfigService.JWT_SECRET.error ||
              appConfigService.BASE_URL.error!,
          );
        }

        return {
          secret: appConfigService.JWT_SECRET.data,
          signOptions: {
            expiresIn: '300s',
            issuer: appConfigService.BASE_URL.data,
          },
        };
      },
    }),
  ],
})
export class AuthModule {}
