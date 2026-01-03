import { Request } from 'express';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TOKEN } from '../constants';

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

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
          userId: string;
          email: string;
        }>(accessToken);

        if (!claims) return false;

        request.user = { id: claims.userId, email: claims.email };

        return true;
      } catch (error) {
        this.logger.error(error);

        return false;
      }
    }

    return false;
  }
}
