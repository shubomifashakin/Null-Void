import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

import { Socket, Server } from 'socket.io';

import { FnResult } from '../../../types/fnResult';

import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class RoomsEventsService {
  private readonly logger = new Logger(RoomsEventsService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  async handleConnection(client: Socket, server: Server) {
    try {
      const roomId = client.handshake.query?.roomId as string;
      if (!roomId) return client.disconnect(true);

      const cookies = client.handshake.headers.cookie;

      if (!cookies) return client.disconnect(true);

      const accessToken = this.getAccessTokenFromCookies(client);

      if (!accessToken) return client.disconnect(true);

      const { data: userInfo, success } =
        await this.extractUserInfoFromAccessToken(accessToken);

      if (!success || !userInfo) return client.disconnect(true);

      const roomExists = await this.databaseService.roomMember.findUnique({
        where: {
          room_id_user_id: { room_id: roomId, user_id: userInfo.userId },
        },
      });

      if (!roomExists) return client.disconnect(true);

      const connectionTime = client.handshake.issued;

      client.data = {
        name: userInfo.name,
        userId: userInfo.userId,
        picture: userInfo.picture,
        joinedAt: new Date(connectionTime),
      };

      await client.join(roomId);

      this.logger.log(`User ${userInfo.userId} joined room ${roomId}`);

      // FIXME: Add client to cross server room tracking

      //FIXME: Broadcast that a new user joined the room
      server.to(roomId).emit('user_joined', {
        name: userInfo.name,
        userId: userInfo.userId,
        picture: userInfo.picture,
      });

      //FIXME: SEND THE CURRENT STATE OF THE ROOM TO THE NEWLY CONNECTED CLIENT
    } catch (error) {
      this.logger.error('Error handling connection:', error);

      return client.disconnect(true);
    }
  }

  private getAccessTokenFromCookies(client: Socket): string | null {
    const cookieHeader = client.handshake.headers.cookie;

    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return cookies['access_token'] || null;
  }

  private async extractUserInfoFromAccessToken(
    token: string,
  ): Promise<
    FnResult<{ name: string; userId: string; picture: string | null }>
  > {
    try {
      const userInfo = await this.jwtService.verifyAsync<{
        name: string;
        userId: string;
        picture: string | null;
      }>(token);

      return { success: true, data: userInfo, error: null };
    } catch (error) {
      this.logger.warn('Error extracting user info from access token:', error);

      return { success: false, data: null, error: 'Invalid access token' };
    }
  }
}
