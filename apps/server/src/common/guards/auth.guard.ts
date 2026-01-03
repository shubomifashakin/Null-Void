import { Request } from 'express';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TOKEN } from '../constants';

import { AppConfigService } from '../../core/app-config/app-config.service';

@Injectable()
export class AuthGuard implements CanActivate {
  logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const requestType = ctx.getType();

    if (requestType === 'http') {
      try {
        const request = ctx.switchToHttp().getRequest<Request>();
        const cookies = request.cookies[TOKEN.ACCESS.TYPE] as
          | string
          | undefined;

        if (!cookies) return false;

        const claims = await this.jwtService.verifyAsync<{
          userId: string;
          email: string;
        }>(cookies, {
          secret: this.configService.JWT_SECRET.data!,
        });

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
