import { Request } from 'express';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';

import { TOKEN } from '../constants';
import { makeBlacklistedKey } from '../utils';

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: CacheRedisService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const requestType = ctx.getType();

    if (requestType === 'http') {
      try {
        const request = ctx.switchToHttp().getRequest<Request>();
        const accessToken = request.cookies[TOKEN.ACCESS.TYPE] as
          | string
          | undefined;

        if (!accessToken) {
          throw new UnauthorizedException('Unauthorized');
        }

        const claims = await this.jwtService.verifyAsync<{
          jti: string;
          userId: string;
        }>(accessToken);

        if (!claims) {
          throw new UnauthorizedException('Unauthorized');
        }

        const blacklisted = await this.redisService.getFromCache<boolean>(
          makeBlacklistedKey(claims.jti),
        );
        if (!blacklisted.success) {
          this.logger.error(blacklisted.error);

          //this might be too strict, whatif redis goes down, do we allow access???
          throw new UnauthorizedException('Unauthorized');
        }

        if (blacklisted.data) {
          throw new UnauthorizedException('Unauthorized');
        }

        request.user = { id: claims.userId };

        return true;
      } catch (error) {
        this.logger.error(error);

        throw new UnauthorizedException('Unauthorized');
      }
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
