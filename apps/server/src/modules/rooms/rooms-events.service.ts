import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

import { Socket, Server } from 'socket.io';

import { FnResult } from '../../../types/fnResult';

@Injectable()
export class RoomsEventsService {
  private readonly logger = new Logger(RoomsEventsService.name);
  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket, server: Server) {
    try {
      console.log('Client connected:', client.id);
      console.log('Client data:', client.data);

      const cookies = client.handshake.headers.cookie;

      if (!cookies) return client.disconnect(true);

      const accessToken = this.getAccessTokenFromCookies(client);

      if (!accessToken) return client.disconnect(true);

      const { data: userInfo, success } =
        await this.extractUserInfoFromAccessToken(accessToken);

      if (!success || !userInfo) return client.disconnect(true);

      const connectionTime = client.handshake.issued;

      client.data = {
        name: userInfo.name,
        userId: userInfo.userId,
        picture: userInfo.picture,
        joinedAt: new Date(connectionTime),
      };

      // FIXME: Add client to cross server room tracking

      //FIXME: Broadcast that a new user joined the room
      server.emit('user_joined', {
        name: userInfo.name,
        userId: userInfo.userId,
        picture: userInfo.picture,
      });
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
