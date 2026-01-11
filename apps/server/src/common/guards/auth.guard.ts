import { Request } from 'express';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { RedisService } from '../../core/redis/redis.service';

import { TOKEN } from '../constants';
import { makeBlacklistedKey } from '../utils';

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const requestType = ctx.getType();

    if (requestType === 'http') {
      try {
        const request = ctx.switchToHttp().getRequest<Request>();
        const accessToken = request.cookies[TOKEN.ACCESS.TYPE] as
          | string
          | undefined;

        if (!accessToken) return false;

        const claims = await this.jwtService.verifyAsync<{
          jti: string;
          userId: string;
        }>(accessToken);

        if (!claims) return false;

        const blacklisted = await this.redisService.getFromCache<boolean>(
          makeBlacklistedKey(claims.jti),
        );

        if (!blacklisted.success) {
          this.logger.error(blacklisted.error);

          //this might be too strict, whatif redis goes down, do we allow access???
          return false;
        }

        if (blacklisted.data) return false;

        request.user = { id: claims.userId };

        return true;
      } catch (error) {
        this.logger.error(error);

        return false;
      }
    }

    return false;
  }
}
