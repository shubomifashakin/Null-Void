/* eslint-disable @typescript-eslint/unbound-method */
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { Server, Socket } from 'socket.io';

import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { BinaryEncodingService } from './encoding.service';
import { RoomsGatewayService } from './rooms-gateway.service';

import { RedisModule } from '../../core/redis/redis.module';
import { RedisService } from '../../core/redis/redis.service';
import { MailerModule } from '../../core/mailer/mailer.module';
import { MailerService } from '../../core/mailer/mailer.service';
import { DatabaseModule } from '../../core/database/database.module';
import { DatabaseService } from '../../core/database/database.service';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { AppConfigService } from '../../core/app-config/app-config.service';

import { DAYS_1 } from '../../common/constants';

import { WS_ERROR_CODES, WS_EVENTS } from './utils/constants';
import { makeRoomDrawEventsCacheKey } from './utils/fns';

const mockDatabaseService = {
  roomMember: {
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  snapshots: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((fn) => {
    const tx = {
      ...mockDatabaseService,
      invite: {
        ...mockDatabaseService.invite,
      },
    };

    return fn(tx);
  }),
  invite: {
    findUniqueOrThrow: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  room: {
    update: jest.fn(),
  },
};

const mockMailerService = {
  sendMail: jest.fn(),
};

const mockRedisService = {
  setInCache: jest.fn(),
  getFromCache: jest.fn(),
  deleteFromCache: jest.fn(),
  hSetInCache: jest.fn(),
  hDeleteFromCache: jest.fn(),
  hGetAllFromCache: jest.fn(),
  hLenFromCache: jest.fn(),
  getFromCacheNoParse: jest.fn(),
  setInCacheNoStringify: jest.fn(),
};

const mockConfigService = {
  BASE_URL: { success: true, data: 'test-base-url' },
  JWT_SECRET: { success: true, data: 'test-jwt-secret' },
  RESEND_API_KEY: { success: true, data: 'test-resend-api-key' },
  MAILER_FROM: { success: true, data: 'test-mailer-from' },
  FRONTEND_URL: { success: true, data: 'test-frontend-url' },
  DOMAIN: { success: true, data: 'test-domain' },
};

const mockLogger = {
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

const mockSocket = {
  handshake: {
    query: jest.fn(),
    headers: jest.fn(),
  },
  data: jest.fn(),
  disconnect: jest.fn(),
  to: jest.fn().mockReturnThis(),
  emit: jest.fn().mockReturnThis(),
  join: jest.fn(),
} as unknown as jest.Mocked<Socket>;

const mockServer = {
  in: jest.fn().mockReturnThis(),
  fetchSockets: jest.fn().mockReturnThis(),
  to: jest.fn().mockReturnThis(),
  emit: jest.fn().mockReturnThis(),
} as unknown as jest.Mocked<Server>;

const mockBinaryService = {
  encode: jest.fn(),
  decode: jest.fn(),
};

const mockJwtService = {
  verifyAsync: jest.fn(),
};

describe('RoomsGatewayService', () => {
  let service: RoomsGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      imports: [
        RedisModule,
        DatabaseModule,
        MailerModule,
        AppConfigModule,
        JwtModule,
      ],
      providers: [
        RoomsGatewayService,
        RoomsService,
        RoomsGateway,
        BinaryEncodingService,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(AppConfigService)
      .useValue(mockConfigService)
      .overrideProvider(BinaryEncodingService)
      .useValue(mockBinaryService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    module.useLogger(mockLogger);

    service = module.get<RoomsGatewayService>(RoomsGatewayService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('draw events', () => {
    it('should effectively handle the draw event but not trigger snapshot since not enough events were found', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';
      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockRedisService.hSetInCache.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });
      mockRedisService.hLenFromCache.mockResolvedValue({
        success: true,
        data: 1,
        error: null,
      });

      const drawEvent = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'circle',
        strokeColor: '#00ff00',
        strokeWidth: 3,
        timestamp: '1642245603000',
        center: {
          x: 150,
          y: 150,
        },
        radius: 50,
        fillStyle: {
          color: '#0000ff',
          opacity: 0.5,
        },
      };

      await service.handleDraw(mockSocket, drawEvent);

      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockRedisService.hSetInCache).toHaveBeenCalledWith(
        makeRoomDrawEventsCacheKey(roomId),
        drawEvent.id,
        drawEvent,
        DAYS_1,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_DRAW, {
        ...drawEvent,
        userId,
      });
      expect(mockRedisService.hLenFromCache).toHaveBeenCalled();
      expect(mockRedisService.setInCache).not.toHaveBeenCalled();
    });

    it('should effectively handle the draw event but not trigger a snapshot since lock was acquired', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';
      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockRedisService.hSetInCache.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });
      mockRedisService.hLenFromCache.mockResolvedValue({
        success: true,
        data: 10,
        error: null,
      });
      mockRedisService.setInCache.mockResolvedValue({
        success: true,
        data: false,
        error: null,
      });

      const drawEvent = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'circle',
        strokeColor: '#00ff00',
        strokeWidth: 3,
        timestamp: '1642245603000',
        center: {
          x: 150,
          y: 150,
        },
        radius: 50,
        fillStyle: {
          color: '#0000ff',
          opacity: 0.5,
        },
      };

      await service.handleDraw(mockSocket, drawEvent);

      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockRedisService.hSetInCache).toHaveBeenCalledWith(
        makeRoomDrawEventsCacheKey(roomId),
        drawEvent.id,
        drawEvent,
        DAYS_1,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_DRAW, {
        ...drawEvent,
        userId,
      });
      expect(mockRedisService.hLenFromCache).toHaveBeenCalled();
      expect(mockRedisService.setInCache).toHaveBeenCalledTimes(1);
      expect(mockRedisService.hGetAllFromCache).not.toHaveBeenCalled();
    });

    it('should effectively handle the draw event & trigger snapshot', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';
      const roomDrawEvents = makeRoomDrawEventsCacheKey(roomId);

      const drawEvent = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'circle',
        strokeColor: '#00ff00',
        strokeWidth: 3,
        timestamp: '1642245603000',
        center: {
          x: 150,
          y: 150,
        },
        radius: 50,
        fillStyle: {
          color: '#0000ff',
          opacity: 0.5,
        },
      };

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockRedisService.hSetInCache.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });
      mockRedisService.hLenFromCache.mockResolvedValue({
        success: true,
        data: 10,
        error: null,
      });
      mockRedisService.setInCache.mockResolvedValue({
        success: true,
        data: true,
        error: null,
      });

      mockRedisService.hGetAllFromCache.mockResolvedValue({
        success: true,
        data: { [drawEvent.id]: drawEvent },
        error: null,
      });
      mockRedisService.getFromCacheNoParse.mockResolvedValue({
        success: true,
        data: 'decoded',
        error: null,
      });

      mockBinaryService.decode.mockReturnValue({
        success: true,
        data: { events: [drawEvent] },
        error: null,
      });

      mockBinaryService.encode.mockReturnValue({
        success: true,
        data: 'encoded',
        error: null,
      });

      mockRedisService.setInCacheNoStringify.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });
      mockRedisService.deleteFromCache.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });

      await service.handleDraw(mockSocket, drawEvent);

      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockRedisService.hSetInCache).toHaveBeenCalledWith(
        roomDrawEvents,
        drawEvent.id,
        drawEvent,
        DAYS_1,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_DRAW, {
        ...drawEvent,
        userId,
      });
      expect(mockRedisService.hLenFromCache).toHaveBeenCalled();
      expect(mockRedisService.setInCache).toHaveBeenCalledTimes(1);
      expect(mockRedisService.hGetAllFromCache).toHaveBeenCalled();
      expect(mockRedisService.getFromCacheNoParse).toHaveBeenCalled();
      expect(mockRedisService.deleteFromCache).toHaveBeenCalledTimes(2);
      expect(mockBinaryService.decode).toHaveBeenCalled();
      expect(mockBinaryService.decode).toHaveBeenCalledWith('decoded');
      expect(mockBinaryService.encode).toHaveBeenCalled();
      expect(mockBinaryService.encode).toHaveBeenCalledWith(
        [drawEvent],
        expect.any(Number),
      );
    });
  });

  describe('connect events', () => {
    it('should not accept event if roomId is invalid', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';
      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      await service.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should not allow user thats not a member to join', async () => {
      const roomId = '2537d7ca-e4cb-4844-8e5e-8442c24ca97b';
      const userId = 'test-user-id';
      mockSocket.handshake.query.roomId = roomId;
      mockSocket.handshake.headers.cookie = 'access_token=fake-access-token';

      mockJwtService.verifyAsync.mockResolvedValue({ userId });
      mockDatabaseService.roomMember.findUnique.mockResolvedValue(null);

      await service.handleConnection(mockSocket);

      expect(mockDatabaseService.roomMember.findUnique).toHaveBeenCalled();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect the user because server failed to get snapshot', async () => {
      const roomId = '2537d7ca-e4cb-4844-8e5e-8442c24ca97b';
      const userId = 'test-user-id';
      mockSocket.handshake.query.roomId = roomId;
      mockSocket.handshake.headers.cookie = 'access_token=fake-access-token';

      mockJwtService.verifyAsync.mockResolvedValue({ userId });
      mockDatabaseService.roomMember.findUnique.mockResolvedValue({
        role: 'ADMIN',
        room: {
          description: 'test description',
          name: 'Test Room',
        },
        user: {
          name: 'Test User',
          picture: null,
        },
      });

      mockRedisService.hGetAllFromCache
        .mockResolvedValueOnce({
          success: true,
          data: {},
          error: null,
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            ['pending-event']: {
              id: 'pending-event',
              timestamp: '200',
            },
          },
          error: null,
        });

      mockRedisService.hSetInCache.mockResolvedValue({
        success: true,
        data: true,
        error: null,
      });

      mockRedisService.getFromCacheNoParse.mockResolvedValue({
        success: false,
        data: 'latest-snapshot',
        error: 'failed',
      });

      mockDatabaseService.snapshots.findFirst.mockRejectedValue(
        new Error('database error'),
      );

      await service.handleConnection(mockSocket);

      expect(mockDatabaseService.roomMember.findUnique).toHaveBeenCalled();

      expect(mockSocket.join).toHaveBeenCalled();

      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.ROOM_INFO, {
        name: 'Test Room',
        description: 'test description',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_INFO, {
        name: 'Test User',
        role: 'ADMIN',
        userId,
        picture: null,
      });

      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_JOINED, {
        name: 'Test User',
        role: 'ADMIN',
        userId,
        picture: null,
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_LIST, {
        users: [],
      });

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should add the user to the room and emit all required events', async () => {
      const roomId = '2537d7ca-e4cb-4844-8e5e-8442c24ca97b';
      const userId = 'test-user-id';
      mockSocket.handshake.query.roomId = roomId;
      mockSocket.handshake.headers.cookie = 'access_token=fake-access-token';

      mockJwtService.verifyAsync.mockResolvedValue({ userId });
      mockDatabaseService.roomMember.findUnique.mockResolvedValue({
        role: 'ADMIN',
        room: {
          description: 'test description',
          name: 'Test Room',
        },
        user: {
          name: 'Test User',
          picture: null,
        },
      });

      mockRedisService.hGetAllFromCache
        .mockResolvedValueOnce({
          success: true,
          data: {},
          error: null,
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            ['pending-event']: {
              id: 'pending-event',
              timestamp: '200',
            },
          },
          error: null,
        });

      mockRedisService.hSetInCache.mockResolvedValue({
        success: true,
        data: true,
        error: null,
      });

      mockRedisService.getFromCacheNoParse.mockResolvedValue({
        success: true,
        data: 'latest-snapshot',
        error: null,
      });

      mockBinaryService.decode.mockReturnValue({
        success: true,
        data: { events: [{ id: 'snapshotted-event', timestamp: '100' }] },
        error: null,
      });

      await service.handleConnection(mockSocket);

      expect(mockDatabaseService.roomMember.findUnique).toHaveBeenCalled();

      expect(mockSocket.join).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.ROOM_INFO, {
        name: 'Test Room',
        description: 'test description',
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_INFO, {
        name: 'Test User',
        role: 'ADMIN',
        userId,
        picture: null,
      });
      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_JOINED, {
        name: 'Test User',
        role: 'ADMIN',
        userId,
        picture: null,
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_LIST, {
        users: [],
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.CANVAS_STATE, {
        state: [
          { id: 'snapshotted-event', timestamp: '100' },
          { id: 'pending-event', timestamp: '200' },
        ],
      });
    });

    it('should fail to successfully connect since redis failed when getting latest snapshot', async () => {
      const roomId = '2537d7ca-e4cb-4844-8e5e-8442c24ca97b';
      const userId = 'test-user-id';
      mockSocket.handshake.query.roomId = roomId;
      mockSocket.handshake.headers.cookie = 'access_token=fake-access-token';

      mockJwtService.verifyAsync.mockResolvedValue({ userId });
      mockDatabaseService.roomMember.findUnique.mockResolvedValue({
        role: 'ADMIN',
        room: {
          description: 'test description',
          name: 'Test Room',
        },
        user: {
          name: 'Test User',
          picture: null,
        },
      });

      mockRedisService.hGetAllFromCache
        .mockResolvedValueOnce({
          success: true,
          data: {},
          error: null,
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            ['pending-event']: {
              id: 'pending-event',
              timestamp: '200',
            },
          },
          error: null,
        });

      mockRedisService.hSetInCache.mockResolvedValue({
        success: true,
        data: true,
        error: null,
      });

      mockRedisService.getFromCacheNoParse.mockResolvedValue({
        success: false,
        data: null,
        error: new Error('failed to get snapshots from cache'),
      });

      mockDatabaseService.snapshots.findFirst.mockResolvedValue({
        payload: [{ id: 'snapshotted-event', timestamp: '100' }],
        timestamp: new Date(),
      });

      mockBinaryService.encode.mockReturnValue({
        success: true,
        data: 'encoded-snapshot',
        error: null,
      });

      mockRedisService.setInCacheNoStringify.mockResolvedValue({
        success: true,
        data: true,
        error: null,
      });

      await service.handleConnection(mockSocket);

      expect(mockDatabaseService.roomMember.findUnique).toHaveBeenCalled();

      expect(mockSocket.join).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.ROOM_INFO, {
        name: 'Test Room',
        description: 'test description',
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_INFO, {
        name: 'Test User',
        role: 'ADMIN',
        userId,
        picture: null,
      });
      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_JOINED, {
        name: 'Test User',
        role: 'ADMIN',
        userId,
        picture: null,
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_LIST, {
        users: [],
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalledWith(WS_EVENTS.CANVAS_STATE, {
        state: [
          { id: 'snapshotted-event', timestamp: '100' },
          { id: 'pending-event', timestamp: '200' },
        ],
      });
    });
  });

  describe('mouse move events', () => {
    it('should handle mouse move events', () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';

      const mouseEvent = {
        x: 20,
        y: 20,
        isPenDown: true,
        timestamp: `${Date.now()}`,
      };

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      service.handleUserMove(mockSocket, mouseEvent);

      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.USER_MOVE, {
        ...mouseEvent,
        userId,
      });
    });

    it('should not emit mouse move events and disconnect user because userId is not available in socket data', () => {
      const roomId = null;
      const userId = null;

      const mouseEvent = {
        x: 20,
        y: 20,
        isPenDown: true,
        timestamp: `${Date.now()}`,
      };

      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      service.handleUserMove(mockSocket, mouseEvent);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.to).not.toHaveBeenCalled();
    });
  });

  describe('leave events', () => {
    it('should handle the user leave event', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockDatabaseService.roomMember.delete.mockResolvedValue(null);

      await service.handleLeave(mockSocket);

      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        WS_EVENTS.ROOM_NOTIFICATION,
        {
          message: `${mockSocket.data.name} left`,
        },
      );

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should fail to remove user due to database error', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockDatabaseService.roomMember.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Fake error', {
          code: '102',
          clientVersion: '7',
        }),
      );

      await service.handleLeave(mockSocket);

      expect(mockSocket.to).not.toHaveBeenCalled();

      expect(mockSocket.disconnect).not.toHaveBeenCalled();

      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.ROOM_ERROR, {
        message: 'Failed to leave room',
        code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
      });

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('remove events', () => {
    it('should handle the remove event', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';
      const userToRemove = 'test-member-id';
      const userToRemoveName = 'Removed User';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockServer.fetchSockets.mockResolvedValue([
        {
          data: {
            name: userToRemoveName,
            userId: userToRemove,
          },
          disconnect: () => {},
        } as Pick<Socket, 'data' | 'disconnect'>,
      ]);

      mockDatabaseService.roomMember.findUnique.mockResolvedValue({
        id: userToRemove,
        role: 'ADMIN',
        room_id: roomId,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      mockDatabaseService.$transaction.mockResolvedValue(null);

      await service.handleRemove(mockServer, mockSocket, userToRemove);

      expect(mockServer.in).toHaveBeenCalledWith(roomId);
      expect(mockServer.fetchSockets).toHaveBeenCalled();

      expect(mockServer.to).toHaveBeenCalledWith(roomId);
      expect(mockServer.emit).toHaveBeenCalledWith(
        WS_EVENTS.ROOM_NOTIFICATION,
        {
          message: `${userToRemoveName} was removed`,
        },
      );
    });

    it('should handle the remove event  and remove a non-existent user from the room', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';
      const userToRemove = 'test-member-id';
      const userToRemoveName = 'Removed User';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      const userDisconnect = jest.fn();
      mockServer.fetchSockets.mockResolvedValue([
        {
          data: {
            name: userToRemoveName,
            userId: userToRemove,
          },
          disconnect: userDisconnect,
        } satisfies Pick<Socket, 'data' | 'disconnect'>,
      ]);

      mockDatabaseService.roomMember.findUnique.mockResolvedValue(null);

      mockDatabaseService.$transaction.mockResolvedValue(null);

      await service.handleRemove(mockServer, mockSocket, userToRemove);

      expect(userDisconnect).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle the remove event error', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';
      const userToRemove = 'test-member-id';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockDatabaseService.roomMember.findUnique.mockRejectedValue(
        new Error('test error'),
      );

      await service.handleRemove(mockServer, mockSocket, userToRemove);

      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.ROOM_ERROR, {
        message: 'Failed to remove user',
        code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
      });

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('disconnect events', () => {
    it('should handle the disconnect event', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockRedisService.hDeleteFromCache.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });

      await service.handleDisconnect(mockSocket);

      expect(mockSocket.to).toHaveBeenCalledWith(roomId);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        WS_EVENTS.USER_DISCONNECTED,
        {
          userId: mockSocket.data.userId,
        },
      );
    });

    it('should not emit an event', async () => {
      const roomId = 'room-1';
      const userId = null;

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockRedisService.hDeleteFromCache.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });

      await service.handleDisconnect(mockSocket);

      expect(mockRedisService.hDeleteFromCache).not.toHaveBeenCalled();
    });
  });

  describe('update room events', () => {
    it('should update the room info & broadcast update', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      const updatedInfo = {
        name: 'Updated name',
        description: 'Updated description',
      };

      mockDatabaseService.room.update.mockResolvedValue(updatedInfo);
      mockRedisService.deleteFromCache.mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });

      const dto = {
        name: 'updated name',
        description: 'updated description',
      };

      await service.handleUpdateRoomInfo(mockServer, mockSocket, dto);

      expect(mockDatabaseService.room.update).toHaveBeenCalled();
      expect(mockRedisService.deleteFromCache).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith(roomId);
      expect(mockServer.emit).toHaveBeenCalledWith(
        WS_EVENTS.ROOM_INFO,
        updatedInfo,
      );
    });

    it('should not update the room info since dto was empty', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockDatabaseService.room.update.mockResolvedValue(null);

      const dto = {};

      await service.handleUpdateRoomInfo(mockServer, mockSocket, dto);

      expect(mockDatabaseService.room.update).not.toHaveBeenCalled();

      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should not update the room since database failed', async () => {
      const roomId = 'room-1';
      const userId = 'test-user-id';

      mockSocket.handshake.query.roomId = roomId;
      mockSocket.data = {
        userId,
        role: 'ADMIN',
        name: 'Test User',
        joinedAt: new Date(),
        picture: null,
      };

      mockDatabaseService.room.update.mockRejectedValue(
        new Error('Test error'),
      );
      const dto = {
        name: 'updated name',
        description: 'updated description',
      };

      await service.handleUpdateRoomInfo(mockServer, mockSocket, dto);

      expect(mockDatabaseService.room.update).toHaveBeenCalled();
      expect(mockServer.to).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith(WS_EVENTS.ROOM_ERROR, {
        message: 'Failed to update room info',
        code: WS_ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
