import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { AppConfigService } from '../../../core/app-config/app-config.service';

@Injectable()
export class MetricsAuthGuard implements CanActivate {
  constructor(private readonly appConfigService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    const expectedToken = this.appConfigService.METRICS_BEARER_TOKEN.data!;

    if (!expectedToken || token !== expectedToken) {
      return false;
    }

    return true;
  }
}
