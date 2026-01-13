import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

import { isUUID } from 'class-validator';

import { Server, Socket } from 'socket.io';

import { JsonValue } from '@prisma/client/runtime/client';

import { MouseMoveDto } from './dtos/mouse-move.dto';

import { WS_ERROR_CODES, WS_EVENTS } from './utils/constants';
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

  async handleDraw(client: Socket, data: string) {
    const roomId = client.handshake.query?.roomId as string;
    const clientInfo = client.data as UserData;

    if (!roomId || !clientInfo?.userId) {
      const errorMessage = !roomId
        ? 'Room ID not found in handshake query'
        : 'User ID not found in client data';

      this.logger.warn({
        message: errorMessage,
      });

      return client.disconnect(true);
    }

    //validate the draw payload
    //append the new draw payload to the existing ones in cache
    //queue the payload so it can be persisted to the database later
    //broadcast the payload to other connected clients
  }

  async handleConnection(client: Socket) {
    try {
      const roomId = client.handshake.query?.roomId as string;
      if (!roomId) return client.disconnect(true);

      const isValidRoomId = isUUID(roomId, 4);

      if (!isValidRoomId) {
        this.logger.warn({
          message: `User tried joining invalid room:${roomId}`,
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

      const userIsMember = await this.databaseService.roomMember.findUnique({
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

      if (!userIsMember) {
        this.logger.warn({
          message: `User ${userInfo.userId} tried to join room ${roomId} but is not a member`,
        });

        return client.disconnect(true);
      }

      const connectionTime = client.handshake.issued;

      client.data = {
        userId: userInfo.userId,
        role: userIsMember.role,
        name: userIsMember.user.name,
        picture: userIsMember.user.picture,
        joinedAt: new Date(connectionTime),
      } satisfies UserData;

      const usersCurrentlyInRoom = await this.getAllUsersInRoom(roomId);

      if (!usersCurrentlyInRoom.success) {
        this.logger.error({
          message: `Failed to get users in room ${roomId}`,
          error: usersCurrentlyInRoom.error,
        });

        return client.disconnect(true);
      }

      const addedUserToCurrentlyActiveUsers =
        await this.addUserToCurrentlyActiveUsersList(
          roomId,
          client.data as UserData,
        );

      if (!addedUserToCurrentlyActiveUsers.success) {
        this.logger.error({
          message: `Failed to add user ${userInfo.userId} to currently active users list`,
          error: addedUserToCurrentlyActiveUsers.error,
        });

        return client.disconnect(true);
      }

      await client.join(roomId);

      //send the room info to the user
      client.emit(WS_EVENTS.ROOM_INFO, {
        name: userIsMember.room.name,
        description: userIsMember.room.description,
      });

      //send the users own info in the room tot the user
      client.emit(WS_EVENTS.USER_INFO, {
        name: userIsMember.user.name,
        role: userIsMember.role,
        userId: userInfo.userId,
        picture: userIsMember.user.picture,
      });

      this.logger.log({
        message: `User ${userInfo.userId} joined room ${roomId}`,
      });

      //inform previous users that a new user joined
      client.to(roomId).emit(WS_EVENTS.USER_JOINED, {
        name: userIsMember.user.name,
        role: userIsMember.role,
        userId: userInfo.userId,
        picture: userIsMember.user.picture,
      });

      //send the previous users in the room to the newly connected client
      client.emit(WS_EVENTS.USER_LIST, {
        users: usersCurrentlyInRoom.data,
      });

      const canvasState = await this.getCanvasState(roomId);

      if (!canvasState.success) {
        this.logger.error({
          message: `Failed to get canvas state for room ${roomId}`,
          error: canvasState.error,
        });

        return client.disconnect(true);
      }

      //send the current canvas state to the newly connected client
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

      const { success, error } = await this.removeUserFromCurrentlyActiveList(
        roomId,
        clientInfo.userId,
      );

      if (!success) {
        this.logger.error({
          message: `Failed to remove user ${clientInfo.userId} from currently active list for room ${roomId}`,
          error,
        });
      }

      //send a message to other connected users that the user disconnected
      client.to(roomId).emit(WS_EVENTS.USER_DISCONNECTED, {
        userId: clientInfo.userId,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return this.logger.error({
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

  //FIXME: RATE LIMIT THIS
  async handleRemove(server: Server, client: Socket, userId: string) {
    const roomId = client.handshake.query?.roomId as string;
    const clientInfo = client.data as UserData;

    try {
      if (!roomId || !clientInfo?.userId) {
        const errorMessage = !roomId
          ? 'Room ID not found in handshake query'
          : 'User ID not found in client data';

        this.logger.warn({
          message: errorMessage,
        });

        return client.disconnect(true);
      }

      const userToRemoveExistsInRoom =
        await this.databaseService.roomMember.findUnique({
          where: { room_id_user_id: { room_id: roomId, user_id: userId } },
        });

      if (!userToRemoveExistsInRoom) {
        return client.emit(WS_EVENTS.ROOM_ERROR, {
          message: 'User does not exist in this room',
          code: WS_ERROR_CODES.NOT_FOUND,
        });
      }

      await this.databaseService.$transaction(async (tx) => {
        await tx.roomMember.delete({
          where: {
            room_id_user_id: {
              room_id: roomId,
              user_id: userId,
            },
          },
        });

        const { success, error } = await this.removeUserFromCurrentlyActiveList(
          roomId,
          userId,
        );

        if (!success) {
          this.logger.error({
            message: `Failed to remove user:${userId} from currently active list for room:${roomId}`,
            error,
          });

          throw new Error(error);
        }
      });

      const socketOfUserToBeRemoved = await this.getUserSocket(
        server,
        userId,
        roomId,
      );

      if (!socketOfUserToBeRemoved || !socketOfUserToBeRemoved.data) return;

      const usersInfo = socketOfUserToBeRemoved.data as UserData;

      //disconnect that user, triggers disconnect block
      socketOfUserToBeRemoved.disconnect(true);

      //inform everyone that the user was removed
      if (usersInfo?.name) {
        server.to(roomId).emit(WS_EVENTS.ROOM_NOTIFICATION, {
          message: `${usersInfo.name} was removed`,
        });
      }
    } catch (error: unknown) {
      this.logger.error({
        message: `Failed to remove user:${userId} from room:${roomId}`,
        error,
      });

      client.emit(WS_EVENTS.ROOM_ERROR, {
        message: 'Failed to remove user',
        code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async handleLeave(client: Socket) {
    try {
      const roomId = client.handshake.query?.roomId as string;

      const clientInfo = client.data as UserData;

      if (!roomId || !clientInfo.userId) {
        const errorMessage = !roomId
          ? 'Room ID not found in handshake query'
          : 'User ID not found in client data';

        this.logger.warn({
          message: errorMessage,
        });

        return client.disconnect(true);
      }

      const roomMember = await this.databaseService.roomMember.findUnique({
        where: {
          room_id_user_id: {
            room_id: roomId,
            user_id: clientInfo.userId,
          },
        },
      });

      if (!roomMember) {
        this.logger.warn({
          message: `User:${clientInfo.userId} was in room:${roomId} but was not a room member`,
        });

        return client.disconnect(true);
      }

      await this.databaseService.roomMember.delete({
        where: {
          room_id_user_id: {
            room_id: roomId,
            user_id: clientInfo.userId,
          },
        },
      });

      client.to(roomId).emit(WS_EVENTS.ROOM_NOTIFICATION, {
        message: `${clientInfo.name} left`,
      });

      client.disconnect(true);
    } catch (error: unknown) {
      client.emit(WS_EVENTS.ROOM_ERROR, {
        message: 'Failed to leave room',
        code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
      });

      if (error instanceof Error) {
        return this.logger.error({
          message: 'Failed to leave room',
          error: error.message,
        });
      }

      this.logger.error({
        message: 'Failed to leave room',
        error,
      });
    }
  }

  handleUserMove(client: Socket, dto: MouseMoveDto) {
    const clientInfo = client.data as UserData;
    const roomId = client.handshake.query.roomId as string;

    if (!roomId || !clientInfo?.userId) {
      const errorMessage = !roomId
        ? 'Room ID not found in handshake query'
        : 'User ID not found in client data';

      this.logger.warn({
        message: errorMessage,
      });

      return client.disconnect(true);
    }

    client.to(roomId).emit(WS_EVENTS.USER_MOVE, {
      x: dto.x,
      y: dto.y,
      timestamp: dto.timestamp,
      userId: clientInfo.userId,
    });
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

  private async addUserToCurrentlyActiveUsersList(
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

  private async removeUserFromCurrentlyActiveList(
    roomId: string,
    userId: string,
  ): Promise<FnResult<null>> {
    const roomKey = makeRoomsUsersCacheKey(roomId);
    const roomUserIdKey = makeRoomUsersIdCacheKey(roomId, userId);

    const { success, error, data } = await this.redisService.hDeleteFromCache(
      roomKey,
      roomUserIdKey,
    );

    if (success) {
      return { success: true, error: null, data };
    }

    return { success, error, data };
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

  private async getUserSocket(server: Server, userId: string, roomId: string) {
    const sockets = await server.in(roomId).fetchSockets();

    const usersSocket = sockets.find((socket) => {
      return (socket.data as UserData)?.userId === userId;
    });

    return usersSocket;
  }
}
