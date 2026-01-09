import { Request } from 'express';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class IsMemberGuard implements CanActivate {
  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requestType = context.getType();

    if (requestType === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const userId = request.user.id;
      const roomId = request.params?.roomId;

      if (!roomId) return false;

      const isMember = await this.databaseService.roomMembers.findUnique({
        where: {
          room_id_user_id: {
            user_id: userId,
            room_id: roomId,
          },
        },
      });

      if (!isMember) return false;

      return true;
    }

    return false;
  }
}
