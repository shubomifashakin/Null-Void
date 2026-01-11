import { Request } from 'express';

import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { ROLE_KEY } from '../decorators/roles.decorators';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class RoomRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id;
    const roomId = request.params.roomId;

    const roleMetadata = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!userId || !roomId) {
      return false;
    }

    if (!roleMetadata || !roleMetadata.length) return true;

    const usersRole = await this.databaseService.roomMember.findUnique({
      where: {
        room_id_user_id: {
          user_id: userId,
          room_id: roomId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!usersRole || !roleMetadata.includes(usersRole.role)) {
      return false;
    }

    return true;
  }
}
