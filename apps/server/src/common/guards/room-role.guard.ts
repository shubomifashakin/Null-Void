import { Request } from 'express';

import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Socket } from 'socket.io';

import { MESSAGES, UserData } from '../constants';
import { ROLE_KEY } from '../decorators/roles.decorators';

import { Roles } from '../../../generated/prisma/enums';
import { DatabaseService } from '../../core/database/database.service';
import { WS_ERROR_CODES, WS_EVENTS } from '../../modules/rooms/utils/constants';

@Injectable()
export class RoomRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const executionType = context.getType();

    if (executionType === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const userId = request.user?.id;
      const roomId = request.params.roomId;

      const roleMetadata = this.reflector.getAllAndOverride<Roles[]>(ROLE_KEY, [
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
            room_id: roomId as string,
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

    if (executionType === 'ws') {
      const client = context.switchToWs().getClient<Socket>();
      const roleMetadata = this.reflector.getAllAndOverride<Roles[]>(ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      const userInfo = client.data as UserData;

      if (!roleMetadata || !roleMetadata.length) return true;

      if (!userInfo?.role || !roleMetadata.includes(userInfo.role)) {
        client.emit(WS_EVENTS.ROOM_ERROR, {
          message: MESSAGES.UNAUTHORIZED,
          code: WS_ERROR_CODES.FORBIDDEN,
        });

        return false;
      }

      return true;
    }

    return false;
  }
}
