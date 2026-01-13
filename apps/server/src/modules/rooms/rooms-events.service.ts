import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

import { isUUID } from 'class-validator';

import { Socket } from 'socket.io';

import { JsonValue } from '@prisma/client/runtime/client';

import { WS_EVENTS } from './utils/constants';
import {
  makeRoomCanvasStateCacheKey,
  makeRoomsUsersCacheKey,
  makeRoomUsersIdCacheKey,
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

      const validatedRoomId = isUUID(roomId, 4);
      if (!validatedRoomId) {
        this.logger.warn({
          message: `User tried joining room ${roomId} with an invalid roomId`,
        });

        return client.disconnect(true);
      }

      const cookies = client.handshake.headers.cookie;

      if (!cookies) return client.disconnect(true);

      const accessToken = this.getAccessTokenFromCookies(client);

      if (!accessToken) return client.disconnect(true);

      const {
        data: userInfo,
        success,
        error: accessTokenError,
      } = await this.extractUserInfoFromAccessToken(accessToken);

      if (!success) {
        this.logger.debug({
          error: accessTokenError,
          message: 'Failed to extract user info from access token',
        });
      }

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
        this.logger.warn({
          message: `User ${userInfo.userId} tried to join room ${roomId} but is not a member`,
        });

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

      const allUsersInTheRoom = await this.getAllUsersInRoom(roomId);

      if (!allUsersInTheRoom.success) {
        this.logger.error({
          message: `Failed to get users in room ${roomId}`,
          error: allUsersInTheRoom.error,
        });

        return client.disconnect(true);
      }

      const userAddedToGlobalTracking = await this.addUserToGlobalRoomTracking(
        roomId,
        client.data as UserData,
      );

      if (!userAddedToGlobalTracking.success) {
        this.logger.error({
          message: `Failed to add user ${userInfo.userId} to global room tracking`,
          error: userAddedToGlobalTracking.error,
        });

        return client.disconnect(true);
      }

      await client.join(roomId);

      //send the room info to the user
      client.emit(WS_EVENTS.ROOM_INFO, {
        name: roomExists.room.name,
        description: roomExists.room.description,
      });

      //send the users own info in the room tot the user
      client.emit(WS_EVENTS.USER_INFO, {
        name: roomExists.user.name,
        role: roomExists.role,
        userId: userInfo.userId,
        picture: roomExists.user.picture,
      });

      this.logger.log({
        message: `User ${userInfo.userId} joined room ${roomId}`,
      });

      //inform previous users that a new user joined
      client.to(roomId).emit(WS_EVENTS.USER_JOINED, {
        name: roomExists.user.name,
        role: roomExists.role,
        userId: userInfo.userId,
        picture: roomExists.user.picture,
      });

      //send the previous users in the room to the newly connected client
      client.emit(WS_EVENTS.USER_LIST, {
        users: allUsersInTheRoom.data,
      });

      const canvasState = await this.getCanvasState(roomId);

      if (!canvasState.success) {
        this.logger.error({
          message: `Failed to get canvas state for room ${roomId}`,
          error: canvasState.error,
        });

        return client.disconnect(true);
      }

      //send the canvas state to the newly connected client
      client.emit(WS_EVENTS.CANVAS_STATE, {
        canvasState: canvasState.data,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error handling connection',
        error,
      });

      return client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const roomId = client.handshake.query?.roomId as string;
      const clientInfo = client.data as UserData;

      if (!roomId || !clientInfo.userId) return;

      const { success, error } = await this.removeUserFromGlobalRoomTracking(
        roomId,
        clientInfo.userId,
      );

      if (!success) {
        this.logger.error({
          message: `Failed to remove user ${clientInfo.userId} from global room tracking for room ${roomId}`,
          error,
        });
      }

      //send a message to other connected users that the user left
      client.to(roomId).emit(WS_EVENTS.USER_LEFT, {
        userId: clientInfo.userId,
      });

      this.logger.debug({
        message: `User ${clientInfo.userId} left room ${roomId}`,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error({
          message: 'Error handling disconnection',
          error: error.message,
        });
      }

      this.logger.error({
        message: 'Error handling disconnection',
        error,
      });
    }
  }

  //FIXME: PAGINATE THE FETCHING OF DRAWINGS
  private async getCanvasState(
    roomId: string,
  ): Promise<FnResult<Record<string, JsonValue>>> {
    try {
      const canvasState = await this.redisService.hGetAllFromCache<
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

      if (!roomDrawings.length) {
        this.logger.warn({ message: `No drawings found for room ${roomId}` });

        return { success: true, data: {}, error: null };
      }

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
      if (error instanceof Error) {
        return { success: false, data: null, error: error.message };
      }

      return { success: false, data: null, error: 'Invalid access token' };
    }
  }

  private async addUserToGlobalRoomTracking(
    roomId: string,
    userInfo: UserData,
  ) {
    const roomKey = makeRoomsUsersCacheKey(roomId);
    const roomUserIdKey = makeRoomUsersIdCacheKey(roomId, userInfo.userId);

    const result = await this.redisService.hSetInCache(
      roomKey,
      roomUserIdKey,
      userInfo,
    );

    return result;
  }

  private async removeUserFromGlobalRoomTracking(
    roomId: string,
    userId: string,
  ) {
    const roomKey = makeRoomsUsersCacheKey(roomId);
    const roomUserIdKey = makeRoomUsersIdCacheKey(roomId, userId);

    const { success, error } = await this.redisService.hDeleteFromCache(
      roomKey,
      roomUserIdKey,
    );

    return { success, error };
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
