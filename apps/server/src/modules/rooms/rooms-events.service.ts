import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

import { Socket } from 'socket.io';

import { JsonValue } from '@prisma/client/runtime/client';

import { WS_EVENTS } from './utils/constants';
import {
  makeRoomCanvasStateCacheKey,
  makeRoomsUsersCacheKey,
} from './utils/fns';

import { FnResult } from '../../../types/fnResult';
import { Roles } from '../../../generated/prisma/enums';

import { RedisService } from '../../core/redis/redis.service';
import { DatabaseService } from '../../core/database/database.service';

interface UserData {
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

  async handleConnection(client: Socket) {
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
          room: {
            select: {
              name: true,
              description: true,
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
      } satisfies UserData;

      const userAddedToGlobalTracking = await this.addUserToGlobalRoomTracking(
        roomId,
        client.data as UserData,
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

      //send the room info to the user
      client.emit(WS_EVENTS.ROOM_INFO, {
        name: roomExists.room.name,
        description: roomExists.room.description,
      });

      this.logger.log(`User ${userInfo.userId} joined room ${roomId}`);

      //inform previous users that a new user joined
      client.to(roomId).emit(WS_EVENTS.USER_JOINED, {
        name: roomExists.user.name,
        role: roomExists.role,
        userId: userInfo.userId,
        picture: roomExists.user.picture,
      });

      //send the previous users in the room to the newly connected client
      client.emit(WS_EVENTS.USER_LIST, allUsersInTheRooms.data);

      const canvasState = await this.getCanvasState(roomId);

      if (!canvasState.success) {
        this.logger.error(canvasState.error);

        return client.disconnect(true);
      }

      //send the canvas state to the newly connected client
      client.emit(WS_EVENTS.CANVAS_STATE, canvasState.data);
    } catch (error) {
      this.logger.error('Error handling connection:', error);

      return client.disconnect(true);
    }
  }

  //FIXME: PAGINATE THE FETCHING OF DRAWINGS
  private async getCanvasState(
    roomId: string,
  ): Promise<FnResult<Record<string, JsonValue>>> {
    try {
      const canvasState = await this.redisService.getFromCache<
        Record<string, JsonValue>
      >(makeRoomCanvasStateCacheKey(roomId));

      if (!canvasState.success) {
        return { success: false, data: null, error: canvasState.error };
      }

      if (canvasState.data) {
        return { success: true, data: canvasState.data, error: null };
      }

      const roomDrawings = await this.databaseService.drawings.findMany({
        where: {
          room_id: roomId,
        },
        select: {
          id: true,
          payload: true,
        },
      });

      const drawings: Record<string, JsonValue> = {};

      for (const drawing of roomDrawings) {
        drawings[drawing.id] = drawing.payload;
      }

      const cached = await this.redisService.hSetObjInCache(
        makeRoomCanvasStateCacheKey(roomId),
        drawings,
      );

      if (!cached.success) {
        return { success: false, data: null, error: cached.error };
      }

      return { success: true, data: drawings, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, data: null, error: error.message };
      }

      return {
        data: null,
        success: false,
        error: `Failed to get canvas state for room ${roomId}`,
      };
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
    userInfo: UserData,
  ) {
    const roomKey = makeRoomsUsersCacheKey(roomId);

    const result = await this.redisService.hSetInCache(
      roomKey,
      userInfo.userId,
      userInfo,
    );

    return result;
  }

  private async getAllUsersInRoom(
    roomId: string,
  ): Promise<FnResult<UserData[]>> {
    const roomKey = makeRoomsUsersCacheKey(roomId);

    const users = await this.redisService.hGetAllFromCache<UserData>(roomKey);

    if (!users.success) {
      return { data: null, error: users.error, success: false };
    }

    const usersInRoom = Object.values(users.data);

    return { data: usersInRoom, error: null, success: true };
  }
}
