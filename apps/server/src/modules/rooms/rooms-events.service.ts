import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

import { Socket, Server } from 'socket.io';

import { WS_EVENTS } from './utils/constants';
import { makeRoomsUsersCacheKey } from './utils/fns';

import { FnResult } from '../../../types/fnResult';
import { Roles } from '../../../generated/prisma/enums';

import { RedisService } from '../../core/redis/redis.service';
import { DatabaseService } from '../../core/database/database.service';

interface SocketData {
  userId: string;
  role: Roles;
  name: string;
  picture: string | null;
  joinedAt: Date;
}

@Injectable()
export class RoomsEventsService {
  private readonly logger = new Logger(RoomsEventsService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
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
        select: {
          user: {
            select: {
              name: true,
              picture: true,
            },
          },
          role: true,
        },
      });

      if (!roomExists) {
        this.logger.warn(
          `User ${userInfo.userId} tried to join room ${roomId} but is not a member`,
        );

        return client.disconnect(true);
      }

      const connectionTime = client.handshake.issued;

      client.data = {
        userId: userInfo.userId,
        role: roomExists.role,
        name: roomExists.user.name,
        picture: roomExists.user.picture,
        joinedAt: new Date(connectionTime),
      } satisfies SocketData;

      const userAddedToGlobalTracking = await this.addUserToGlobalRoomTracking(
        roomId,
        client.data as SocketData,
      );

      if (!userAddedToGlobalTracking.success) {
        this.logger.error(
          `Failed to add user ${userInfo.userId} to global room tracking`,
          { error: userAddedToGlobalTracking.error },
        );

        return client.disconnect(true);
      }

      const allUsersInTheRooms = await this.getAllUsersInRoom(roomId);

      if (!allUsersInTheRooms.success) {
        this.logger.error(`Failed to get users in room ${roomId}`, {
          error: allUsersInTheRooms.error,
        });

        return client.disconnect(true);
      }

      await client.join(roomId);

      this.logger.log(`User ${userInfo.userId} joined room ${roomId}`);

      //FIXME: WOULD EMITTING TO ALL CLIENTS ALSO EMIT TO THE CLIENT THAT SENT THE MESSAGE?
      //FIXME: brdcast that a new user joined the room to all previously connected clients
      client.to(roomId).emit(WS_EVENTS.USER_JOINED, {
        name: roomExists.user.name,
        role: roomExists.role,
        userId: userInfo.userId,
        picture: roomExists.user.picture,
      });

      //FIXME: Send the list of all users in the room to the newly connected client
      client.emit(WS_EVENTS.USER_LIST, allUsersInTheRooms.data);

      //FIXME: SEND THE CURRENT STATE OF THE ROOM TO THE NEWLY CONNECTED CLIENT
      // the current drawing state
      //the room information
      //send the users own info to themselves
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
  ): Promise<FnResult<{ userId: string }>> {
    try {
      const userInfo = await this.jwtService.verifyAsync<{
        userId: string;
      }>(token);

      return { success: true, data: userInfo, error: null };
    } catch (error) {
      this.logger.warn('Error extracting user info from access token:', error);

      return { success: false, data: null, error: 'Invalid access token' };
    }
  }

  private async addUserToGlobalRoomTracking(
    roomId: string,
    userInfo: SocketData,
  ) {
    const roomKey = makeRoomsUsersCacheKey(roomId);

    const result = await this.redisService.hSetInCache(
      roomKey,
      userInfo.userId,
      userInfo,
    );

    return result;
  }

  private async getAllUsersInRoom(roomId: string) {
    const roomKey = makeRoomsUsersCacheKey(roomId);

    const users = await this.redisService.hGetAllFromCache<SocketData>(roomKey);

    return users;
  }
}
