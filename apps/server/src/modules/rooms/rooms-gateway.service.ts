import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { isUUID } from 'class-validator';

import { Queue } from 'bullmq';

import { RemoteSocket, Server, Socket } from 'socket.io';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import {
  CircleEventDto,
  LineEventDto,
  PolygonEventDto,
} from './dtos/draw-event.dto';
import { PromoteDto } from './dtos/promote.dto';
import { MouseMoveDto } from './dtos/mouse-move.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';

import { BinaryEncodingService } from './encoding.service';

import {
  MAX_NUMBER_OF_DRAW_EVENTS,
  WS_ERROR_CODES,
  WS_EVENTS,
} from './utils/constants';
import {
  makeLockKey,
  makeRoomCacheKey,
  makeRoomDrawEventsCacheKey,
  makeRoomSnapshotCacheKey,
  makeRoomsUsersCacheKey,
  makeRoomUsersIdCacheKey,
} from './utils/fns';

import { FnResult, makeError } from '../../../types/fnResult';
import { Roles } from '../../../generated/prisma/enums';

import { DAYS_1 } from '../../common/constants';

import { RedisService } from '../../core/redis/redis.service';
import { DatabaseService } from '../../core/database/database.service';
import { DrawEvent } from '../../core/protos/draw_event';

interface UserData {
  userId: string;
  role: Roles;
  name: string;
  picture: string | null;
  joinedAt: Date;
}

@Injectable()
export class RoomsGatewayService {
  private readonly logger = new Logger(RoomsGatewayService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly databaseService: DatabaseService,
    private readonly binaryEncodingService: BinaryEncodingService,
    @InjectQueue('rooms') private readonly roomsQueue: Queue,
  ) {}

  async handleDraw(
    client: Socket,
    data: PolygonEventDto | LineEventDto | CircleEventDto,
  ) {
    try {
      const roomId = client.handshake.query?.roomId as string;
      const clientInfo = client.data as UserData;

      if (!this.validateSocketState(client, roomId, clientInfo?.userId)) {
        return;
      }

      const roomDrawEventsCacheKey = makeRoomDrawEventsCacheKey(roomId);
      const appendedToDrawEventList = await this.redisService.hSetInCache(
        roomDrawEventsCacheKey,
        data.id,
        data,
        DAYS_1,
      );

      //if failed to append to draw events list, send undo event back
      if (!appendedToDrawEventList.success) {
        this.logger.error({
          message: `Failed to append draw event to draw events list for room:${roomId}`,
          error: appendedToDrawEventList.error,
        });

        return client.emit(WS_EVENTS.ROOM_UNDO_DRAW, {
          code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
          id: data.id,
        });
      }

      client.to(roomId).emit(WS_EVENTS.USER_DRAW, {
        ...data,
        userId: clientInfo.userId,
      });

      //get the current length of pending draw events
      const totalNumberOfDrawEvents = await this.redisService.hLenFromCache(
        roomDrawEventsCacheKey,
      );

      if (!totalNumberOfDrawEvents.success) {
        return this.logger.error({
          message: `Failed to get total number of draw events for room ${roomId}`,
          error: totalNumberOfDrawEvents.error,
        });
      }

      //if the total pending draw events is less than the max pending draw events allowed, do not snapshot
      if (totalNumberOfDrawEvents.data < MAX_NUMBER_OF_DRAW_EVENTS) return;

      //acquire lock on draw events for the room
      const acquiredLock = await this.redisService.setInCache(
        makeLockKey(roomDrawEventsCacheKey),
        'locked',
        20,
        'NX',
      );

      if (!acquiredLock.success) {
        return this.logger.error({
          message: `Failed to acquire lock on draw events for room ${roomId}`,
          error: acquiredLock.error,
        });
      }

      if (!acquiredLock.data) {
        return this.logger.debug({
          message: `Lock already acquired for room ${roomId}`,
        });
      }

      //get all pending draw events
      const allPendingDrawEvents =
        await this.redisService.hGetAllFromCache<DrawEvent>(
          roomDrawEventsCacheKey,
        );

      if (!allPendingDrawEvents.success) {
        return this.logger.error({
          message: `Failed to get all currently pending draw events for room ${roomId}`,
          error: allPendingDrawEvents.error,
        });
      }

      const arrayOfPendingDrawEvents = Object.values(allPendingDrawEvents.data);

      const lastCanvasSnapshot = await this.getLatestSnapshot(roomId);

      if (!lastCanvasSnapshot.success) {
        return this.logger.error({
          message: `Failed to get latest snapshot for room ${roomId}`,
          error: lastCanvasSnapshot.error,
        });
      }

      //append to existing canvas snapshot if not empty
      const allEvents = this.mergeSnapshotsWithPendingEvents(
        lastCanvasSnapshot.data,
        arrayOfPendingDrawEvents,
      );

      this.logger.debug({
        message: `Merged ${arrayOfPendingDrawEvents.length} draw events with latest snapshot for room ${roomId}`,
      });

      const snapshotCreated = await this.takeSnapshot(
        roomId,
        allEvents,
        Date.now(),
      );

      if (!snapshotCreated.success) {
        return this.logger.error({
          message: `Failed to create snapshot for room ${roomId}`,
          error: snapshotCreated.error,
        });
      }

      this.logger.debug({
        message: `Created snapshot for room ${roomId}`,
      });

      const deletedPendingEventsFromCache =
        await this.redisService.deleteFromCache(roomDrawEventsCacheKey);

      if (!deletedPendingEventsFromCache.success) {
        this.logger.error({
          message: `Failed to delete pending draw events from cache for room ${roomId}`,
          error: deletedPendingEventsFromCache.error,
        });
      }

      const unlocked = await this.redisService.deleteFromCache(
        makeLockKey(roomDrawEventsCacheKey),
      );

      if (!unlocked.success) {
        this.logger.error({
          message: `Failed to remove lock on draw events for room ${roomId}`,
          error: unlocked.error,
        });
      }

      await this.roomsQueue.add(
        'process-snapshot',
        {
          roomId,
          snapshotKey: snapshotCreated.data,
        },
        { jobId: snapshotCreated.data },
      );
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to handle draw event',
        error,
      });
    }
  }

  async handleConnection(client: Socket) {
    try {
      const roomId = client.handshake.query?.roomId as string;
      if (!roomId) {
        this.logger.warn({
          message: `roomId is not specified`,
        });

        return client.disconnect(true);
      }

      const isValidRoomId = isUUID(roomId, 4);

      if (!isValidRoomId) {
        this.logger.warn({
          message: `User tried joining invalid room:${roomId}`,
        });

        return client.disconnect(true);
      }

      const cookies = client.handshake.headers.cookie;

      if (!cookies) {
        this.logger.debug({
          message: 'No cookies found disconnecting',
        });

        return client.disconnect(true);
      }

      const accessToken = this.getAccessTokenFromCookies(client);

      if (!accessToken) {
        this.logger.debug({
          message: 'No access token found disconnecting',
        });

        return client.disconnect(true);
      }

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

      const usersCurrentlyInRoom =
        await this.getAllCurrentlyActiveUsersInRoom(roomId);

      if (!usersCurrentlyInRoom.success) {
        this.logger.error({
          message: `Failed to get users in room ${roomId}`,
          error: usersCurrentlyInRoom.error,
        });

        return client.disconnect(true);
      }

      await client.join(roomId);

      const joinedAt = Date.now();

      client.data = {
        userId: userInfo.userId,
        role: userIsMember.role,
        name: userIsMember.user.name,
        picture: userIsMember.user.picture,
        joinedAt: new Date(joinedAt),
      } satisfies UserData;

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

      this.logger.debug({
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

      const roomDrawEventsCacheKey = makeRoomDrawEventsCacheKey(roomId);
      const allPendingDrawEvents =
        await this.redisService.hGetAllFromCache<DrawEvent>(
          roomDrawEventsCacheKey,
        );

      if (!allPendingDrawEvents.success) {
        this.logger.error({
          message: `Failed to get pending draw events for room ${roomId}`,
          error: allPendingDrawEvents.error,
        });

        return client.disconnect(true);
      }

      const drawEventsThatHappenedRightBeforeUserJoined = Object.values(
        allPendingDrawEvents.data,
      ).filter((value) => {
        return Number(value.timestamp) < joinedAt;
      });

      const snapshot = await this.getLatestSnapshot(roomId);

      if (!snapshot.success) {
        this.logger.error({
          message: `Failed to get canvas snapshot for room ${roomId}`,
          error: snapshot.error,
        });

        return client.disconnect(true);
      }

      const mergedSnapShotsAndPendingEvents =
        this.mergeSnapshotsWithPendingEvents(
          snapshot.data,
          drawEventsThatHappenedRightBeforeUserJoined,
        );

      //send the current canvas state to the newly connected client
      client.emit(WS_EVENTS.CANVAS_STATE, {
        state: mergedSnapShotsAndPendingEvents,
      });

      client.emit(WS_EVENTS.ROOM_READY, {
        ready: true,
        timestamp: Date.now(),
        roomId,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error handling connection',
        error,
      });

      return client.disconnect(true);
    }
  }

  async handleUpdateRoomInfo(
    server: Server,
    client: Socket,
    dto: UpdateRoomDto,
  ) {
    try {
      const roomId = client.handshake.query?.roomId as string;
      const clientInfo = client.data as UserData;

      if (!this.validateSocketState(client, roomId, clientInfo?.userId)) {
        return;
      }

      if (!dto.description && !dto.name) {
        this.logger.debug({
          message: 'Update room info payload was empty',
        });

        return;
      }

      const updatedRoomInfo = await this.databaseService.room.update({
        where: { id: roomId },
        data: dto,
        select: {
          name: true,
          description: true,
        },
      });

      const cacheInvalidated = await this.redisService.deleteFromCache(
        makeRoomCacheKey(roomId),
      );

      if (!cacheInvalidated.success) {
        this.logger.error({
          message: `Failed to invalidate cache for room ${roomId}`,
          error: cacheInvalidated.error,
        });
      }

      server.to(roomId).emit(WS_EVENTS.ROOM_INFO, {
        ...updatedRoomInfo,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Error updating room info',
        error,
      });

      client.emit(WS_EVENTS.ROOM_ERROR, {
        message: 'Failed to update room info',
        code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
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
      this.logger.error({
        message: 'Error handling disconnection',
        error,
      });
    }
  }

  async handleRemove(server: Server, client: Socket, userId: string) {
    const roomId = client.handshake.query?.roomId as string;
    const clientInfo = client.data as UserData;

    try {
      if (!this.validateSocketState(client, roomId, clientInfo?.userId)) {
        return;
      }

      const socketOfUserToBeRemoved = await this.getUserSocket(
        server,
        userId,
        roomId,
      );

      if (!socketOfUserToBeRemoved.success) {
        this.logger.error({
          message: `Failed to get socket for user ${userId} in room ${roomId}`,
          error: socketOfUserToBeRemoved.error,
        });

        throw socketOfUserToBeRemoved.error;
      }

      const userToRemoveExistsInRoom =
        await this.databaseService.roomMember.findUnique({
          where: { room_id_user_id: { room_id: roomId, user_id: userId } },
        });

      if (!userToRemoveExistsInRoom && socketOfUserToBeRemoved.data) {
        this.logger.warn({
          message: `user:${userId} was in room:${roomId} but was not a room member`,
        });

        socketOfUserToBeRemoved.data.disconnect(true);

        return;
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

          throw error;
        }
      });

      if (!socketOfUserToBeRemoved.data) return;

      const usersInfo = socketOfUserToBeRemoved.data.data;

      //disconnect that user, triggers disconnect block
      socketOfUserToBeRemoved.data.disconnect(true);

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

      if (!this.validateSocketState(client, roomId, clientInfo?.userId)) {
        return;
      }

      await this.databaseService.roomMember
        .delete({
          where: {
            room_id_user_id: {
              room_id: roomId,
              user_id: clientInfo.userId,
            },
          },
        })
        .catch((error) => {
          if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
              this.logger.warn({
                message: `User:${clientInfo.userId} was in room:${roomId} but was not a room member`,
              });

              return client.disconnect(true);
            }
          }

          throw error;
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

      this.logger.error({
        message: 'Failed to leave room',
        error,
      });
    }
  }

  async handlePromote(server: Server, client: Socket, dto: PromoteDto) {
    try {
      const roomId = client.handshake.query?.roomId as string;
      const clientInfo = client.data as UserData;

      if (!this.validateSocketState(client, roomId, clientInfo?.userId)) {
        return;
      }

      await this.databaseService.$transaction(async (tx) => {
        const usersSocket = await this.getUserSocket(
          server,
          dto.userId,
          roomId,
        );

        if (!usersSocket.success) {
          throw usersSocket.error;
        }

        await tx.roomMember.update({
          where: {
            room_id_user_id: {
              room_id: roomId,
              user_id: dto.userId,
            },
          },
          data: {
            role: dto.role,
          },
        });

        const userIsActive = await this.getUserFromCurrentlyActiveList(
          roomId,
          dto.userId,
        );

        if (!userIsActive.success) {
          throw userIsActive.error;
        }

        if (!userIsActive.data) return;

        const updated = await this.addUserToCurrentlyActiveUsersList(roomId, {
          ...userIsActive.data,
          role: dto.role,
        });

        if (!updated.success) {
          throw updated.error;
        }

        if (!usersSocket.data) return;

        usersSocket.data.data.role = dto.role;
      });

      server.to(roomId).emit(WS_EVENTS.USER_PROMOTED, {
        role: dto.role,
        userId: dto.userId,
      });

      server.to(roomId).emit(WS_EVENTS.ROOM_NOTIFICATION, {
        message: `${clientInfo.name} promoted ${dto.userId} to ${dto.role}`,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to promote user',
        error,
      });

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          client.emit(WS_EVENTS.ROOM_ERROR, {
            message: 'User not found',
            code: WS_ERROR_CODES.NOT_FOUND,
          });

          return;
        }
      }

      client.emit(WS_EVENTS.ROOM_ERROR, {
        message: 'Failed to promote user',
        code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  handleUserMove(client: Socket, dto: MouseMoveDto) {
    try {
      const clientInfo = client.data as UserData;
      const roomId = client.handshake.query.roomId as string;

      if (!this.validateSocketState(client, roomId, clientInfo?.userId)) {
        return;
      }

      client.to(roomId).emit(WS_EVENTS.USER_MOVE, {
        ...dto,
        userId: clientInfo.userId,
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to handle user move',
        error,
      });
    }
  }

  private validateSocketState(
    client: Socket,
    roomId?: string,
    userId?: string,
  ): boolean {
    if (!roomId || !userId) {
      const errorMessage = !roomId
        ? 'Room ID not found in handshake query'
        : 'User ID not found in client data';

      this.logger.warn({ message: errorMessage });

      client.disconnect(true);

      return false;
    }
    return true;
  }

  private async takeSnapshot(
    roomId: string,
    events: DrawEvent[],
    timestamp: number,
  ) {
    const encoded = this.binaryEncodingService.encode(events, timestamp);

    if (!encoded.success) {
      return encoded;
    }

    const snapshotKey = makeRoomSnapshotCacheKey(roomId);
    const done = await this.redisService.setInCacheNoStringify(
      snapshotKey,
      encoded.data,
      DAYS_1,
    );

    if (!done.success) {
      return done;
    }

    return { success: true, error: null, data: snapshotKey };
  }

  private async getLatestSnapshot(
    roomId: string,
  ): Promise<FnResult<DrawEvent[]>> {
    try {
      const { success, error, data } =
        await this.redisService.getFromCacheNoParse<Buffer>(
          makeRoomSnapshotCacheKey(roomId),
        );

      if (!success) {
        this.logger.error({
          message: 'Failed to get canvas snapshot from redis',
          error,
        });

        return { success, error, data };
      }

      if (success && data) {
        const decoded = this.binaryEncodingService.decode(data);

        if (!decoded.success) {
          this.logger.error({
            message: 'Failed to decode canvas snapshot from redis',
            error: decoded.error,
          });

          return { success: false, data: null, error: decoded.error };
        }

        return { success: true, data: decoded.data.events || [], error: null };
      }

      this.logger.debug({
        message: `Cache miss: no snapshot for room:${roomId} in cache, getting from database`,
      });

      const latestSnapshot = await this.databaseService.snapshots.findFirst({
        where: {
          room_id: roomId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1,
        select: {
          payload: true,
          timestamp: true,
        },
      });

      if (!latestSnapshot) {
        this.logger.debug({
          message: `No snapshot for room:${roomId} in database`,
        });
        return { success: true, data: [], error: null };
      }

      const storeSnapshot = await this.takeSnapshot(
        roomId,
        latestSnapshot.payload as unknown as DrawEvent[],
        latestSnapshot.timestamp.getTime(),
      );

      if (storeSnapshot.error) {
        this.logger.error({
          message: `Failed to store snapshot for room:${roomId} in cache`,
          error: storeSnapshot.error,
        });
      }

      return {
        success: true,
        data: latestSnapshot.payload as unknown as DrawEvent[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: makeError(error),
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
      return { success: false, data: null, error: makeError(error) };
    }
  }

  private async getUserFromCurrentlyActiveList(roomId: string, userId: string) {
    const roomKey = makeRoomsUsersCacheKey(roomId);
    const roomUserIdKey = makeRoomUsersIdCacheKey(roomId, userId);

    const result = await this.redisService.hGetFromCache<UserData>(
      roomKey,
      roomUserIdKey,
    );

    return result;
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
      DAYS_1,
    );

    return result;
  }

  private async removeUserFromCurrentlyActiveList(
    roomId: string,
    userId: string,
  ): Promise<FnResult<null>> {
    const roomKey = makeRoomsUsersCacheKey(roomId);
    const roomUserIdKey = makeRoomUsersIdCacheKey(roomId, userId);

    const result = await this.redisService.hDeleteFromCache(
      roomKey,
      roomUserIdKey,
    );

    return result;
  }

  private async getAllCurrentlyActiveUsersInRoom(
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

  private async getUserSocket(
    server: Server,
    userId: string,
    roomId: string,
  ): Promise<FnResult<RemoteSocket<any, UserData> | null>> {
    try {
      const sockets = await server.in(roomId).fetchSockets();

      const usersSocket = sockets.find((socket) => {
        return (socket.data as UserData)?.userId === userId;
      });

      if (!usersSocket) {
        return { success: true, data: null, error: null };
      }

      return { success: true, data: usersSocket, error: null };
    } catch (error: unknown) {
      return { success: false, data: null, error: makeError(error) };
    }
  }

  private mergeSnapshotsWithPendingEvents(
    last: DrawEvent[] | null,
    pending: DrawEvent[],
  ) {
    const dedupeById = (events: DrawEvent[]) => {
      const seen = new Set<string>();
      return events.filter((ev) => {
        if (seen.has(ev.id)) return false;
        seen.add(ev.id);
        return true;
      });
    };

    const allEvents = dedupeById([...(last || []), ...pending]).sort((a, b) => {
      return Number(a.timestamp) - Number(b.timestamp);
    });

    return allEvents;
  }
}
