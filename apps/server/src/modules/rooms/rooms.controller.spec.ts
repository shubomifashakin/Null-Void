import { Request } from 'express';

import { JwtModule } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { BinaryEncodingService } from './encoding.service';
import { RoomsGatewayService } from './rooms-gateway.service';

import { generateInviteMail, makeRoomCacheKey } from './utils/fns';

import { CacheRedisModule } from '../../core/cache-redis/cache-redis.module';
import { MailerModule } from '../../core/mailer/mailer.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';

import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';
import { MailerService } from '../../core/mailer/mailer.service';
import { DatabaseService } from '../../core/database/database.service';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { QueueRedisModule } from '../../core/queue-redis/queue-redis.module';
import { QueueRedisService } from '../../core/queue-redis/queue-redis.service';

import { InviteStatus } from '../../../generated/prisma/enums';
import { BullModule } from '@nestjs/bullmq';
import { IDLE_SNAPSHOT_QUEUE } from './utils/constants';

const mockDatabaseService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  room: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  roomMember: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
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
};

const mockMailerService = {
  sendMail: jest.fn(),
};

const mockRedisService = {
  setInCache: jest.fn(),
  getFromCache: jest.fn(),
  deleteFromCache: jest.fn(),
};

const mockQueueRedisService = {
  setInCache: jest.fn(),
  getFromCache: jest.fn(),
  deleteFromCache: jest.fn(),
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

const mockRequest = {
  user: {
    id: 'test-user-id',
  },
} as unknown as Request;

describe('RoomsController', () => {
  let controller: RoomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        RoomsService,
        RoomsGateway,
        RoomsGatewayService,
        BinaryEncodingService,
      ],
      imports: [
        DatabaseModule,
        CacheRedisModule,
        QueueRedisModule,
        MailerModule,
        AppConfigModule,
        JwtModule,
        BullModule.registerQueue({
          name: IDLE_SNAPSHOT_QUEUE,
        }),
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .overrideProvider(CacheRedisService)
      .useValue(mockRedisService)
      .overrideProvider(QueueRedisService)
      .useValue(mockQueueRedisService)
      .overrideProvider(AppConfigService)
      .useValue(mockConfigService)
      .compile();

    module.useLogger(mockLogger);

    controller = module.get<RoomsController>(RoomsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a room', async () => {
    mockDatabaseService.room.create.mockResolvedValue({
      id: 'test-room-id',
      name: 'test-room',
      owner_id: 'test-user-id',
      created_at: new Date(),
      description: 'test-description',
    });

    mockRedisService.setInCache.mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await controller.createRoom(mockRequest, {
      name: 'test-room',
      description: 'test-description',
    });

    expect(mockDatabaseService.room.create).toHaveBeenCalledTimes(1);
    expect(mockRedisService.setInCache).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'test-room-id' });
  });

  it('should handle redis cache failure when creating a room', async () => {
    mockDatabaseService.room.create.mockResolvedValue({
      id: 'test-room-id',
      name: 'test-room',
      owner_id: 'test-user-id',
      created_at: new Date(),
      description: 'test-description',
    });

    mockRedisService.setInCache.mockResolvedValue({
      success: false,
      error: 'test-error',
    });

    const result = await controller.createRoom(mockRequest, {
      name: 'test-room',
      description: 'test-description',
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'test-error',
      undefined,
      'RoomsService',
    );

    expect(mockDatabaseService.room.create).toHaveBeenCalledTimes(1);
    expect(mockRedisService.setInCache).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'test-room-id' });
  });

  it('should get rooms for a user', async () => {
    const createdAt = new Date(100);
    const joinedAt = new Date(200);

    const rooms = Array(11)
      .fill(0)
      .map((_, i) => ({
        id: `test-room-id-${i}`,
        role: 'ADMIN',
        created_at: joinedAt,
        room: {
          id: `test-room-id-${i}`,
          name: `test-room-${i}`,
          description: `test-description-${i}`,
          created_at: createdAt,
        },
      }));

    mockDatabaseService.roomMember.findMany.mockResolvedValue(rooms);

    const result = await controller.getRooms(mockRequest);

    expect(mockDatabaseService.roomMember.findMany).toHaveBeenCalledTimes(1);

    const selected = rooms.slice(0, 10);
    const transformed = selected.map((data) => {
      return {
        role: data.role,
        id: data.room.id,
        name: data.room.name,
        joinedAt: data.created_at,
        createdAt: data.room.created_at,
        description: data.room.description,
      };
    });

    expect(result).toEqual({
      data: transformed,
      cursor: rooms[rooms.length - 1].id,
      hasNextPage: true,
    });
  });

  it('should update the room', async () => {
    const room = {
      id: 'test-room-id',
      name: 'updated-room',
      description: 'updated-description',
      created_at: new Date(),
    };

    mockDatabaseService.room.update.mockResolvedValue(room);
    mockRedisService.setInCache.mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await controller.updateRoom('test-room-id', {
      name: 'updated-room',
      description: 'updated-description',
    });

    expect(mockDatabaseService.room.update).toHaveBeenCalledTimes(1);
    expect(mockRedisService.setInCache).toHaveBeenCalledTimes(1);
    expect(mockRedisService.setInCache).toHaveBeenCalledWith(
      makeRoomCacheKey('test-room-id'),
      room,
    );
    expect(result).toEqual({ message: 'success' });
  });

  it('should delete the room', async () => {
    mockDatabaseService.room.delete.mockResolvedValue(null);
    mockRedisService.deleteFromCache.mockResolvedValue({
      success: true,
      error: null,
    });

    const result = await controller.deleteRoom('test-room-id');

    expect(mockDatabaseService.room.delete).toHaveBeenCalledTimes(1);
    expect(mockRedisService.deleteFromCache).toHaveBeenCalledTimes(1);
    expect(mockRedisService.deleteFromCache).toHaveBeenCalledWith(
      makeRoomCacheKey('test-room-id'),
    );
    expect(result).toEqual({ message: 'success' });
  });

  it('should invite the user', async () => {
    const invitersInfo = {
      name: 'test-name',
      email: 'test-email@test.com',
    };
    mockDatabaseService.user.findUniqueOrThrow.mockResolvedValue(invitersInfo);

    const inviteInfo = {
      id: 'test-invite-id',
      room: { name: 'test-room-name' },
      expires_at: new Date(),
    };

    mockDatabaseService.invite.create.mockResolvedValue(inviteInfo);

    mockMailerService.sendMail.mockResolvedValue({
      success: true,
      error: null,
    });

    const inviteeEmail = 'invited-user@test.com';
    const result = await controller.inviteUser(mockRequest, 'test-room-id', {
      email: inviteeEmail,
      role: 'VIEWER',
    });

    expect(result).toEqual({ message: 'success' });
    expect(mockDatabaseService.$transaction).toHaveBeenCalledTimes(1);
    expect(mockDatabaseService.user.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDatabaseService.invite.create).toHaveBeenCalledTimes(1);
    expect(mockMailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(mockMailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        receiver: inviteeEmail,
        sender: 'test-mailer-from',
        subject: `You have been invited to join ${inviteInfo.room.name}`,
        html: generateInviteMail({
          inviterName: invitersInfo.name,
          roomName: inviteInfo.room.name,
          inviteLink: `${mockConfigService.FRONTEND_URL.data}/invites/${inviteInfo.id}`,
          expiryDate: inviteInfo.expires_at,
        }),
      }),
    );
  });

  it('should not invite self', async () => {
    const invitersInfo = {
      name: 'test-name',
      email: 'test-email@test.com',
    };

    mockDatabaseService.user.findUniqueOrThrow.mockResolvedValue(invitersInfo);

    await expect(
      controller.inviteUser(mockRequest, 'test-room-id', {
        email: invitersInfo.email,
        role: 'VIEWER',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockDatabaseService.$transaction).toHaveBeenCalledTimes(1);
    expect(mockDatabaseService.user.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDatabaseService.invite.create).not.toHaveBeenCalled();
    expect(mockMailerService.sendMail).not.toHaveBeenCalled();
  });

  it('should get invites for a room and return the paginated result', async () => {
    const createdAt = new Date(100);

    const invites = Array(11)
      .fill(0)
      .map((_, i) => ({
        id: `test-room-id-${i}`,
        role: 'ADMIN',
        created_at: createdAt,
        email: `test-email-${i}@test.com`,
        status: InviteStatus.PENDING,
        expires_at: new Date(300),
        inviter_id: `test-inviter-id-${i}`,
        inviter: {
          name: `test-inviter-${i}`,
          id: `test-inviter-id-${i}`,
        },
      }));

    mockDatabaseService.invite.findMany.mockResolvedValue(invites);

    const result = await controller.getInvites('test-room-id');

    expect(mockDatabaseService.invite.findMany).toHaveBeenCalledTimes(1);

    const data = invites.slice(0, 10);
    const hasNextPage = invites.length > 10;
    const next = data.length > 0 ? invites[invites.length - 1].id : null;

    const transformed = data.map((data) => {
      return {
        id: data.id,
        role: data.role,
        email: data.email,
        status: data.status,
        expiresAt: data.expires_at,
        invitersName: data.inviter.name,
        invitersId: data.inviter_id,
        createdAt: data.created_at,
      };
    });

    expect(result).toEqual({
      data: transformed,
      cursor: next,
      hasNextPage,
    });
  });

  it('should get invites for a room and not be paginated', async () => {
    const createdAt = new Date(100);

    const invites = Array(2)
      .fill(0)
      .map((_, i) => ({
        id: `test-room-id-${i}`,
        role: 'ADMIN',
        created_at: createdAt,
        email: `test-email-${i}@test.com`,
        status: InviteStatus.PENDING,
        expires_at: new Date(300),
        inviter_id: `test-inviter-id-${i}`,
        inviter: {
          name: `test-inviter-${i}`,
          id: `test-inviter-id-${i}`,
        },
      }));

    mockDatabaseService.invite.findMany.mockResolvedValue(invites);

    const result = await controller.getInvites('test-room-id');

    expect(mockDatabaseService.invite.findMany).toHaveBeenCalledTimes(1);

    const data = invites.slice(0, 10);
    const transformed = data.map((data) => {
      return {
        id: data.id,
        role: data.role,
        email: data.email,
        status: data.status,
        expiresAt: data.expires_at,
        invitersName: data.inviter.name,
        invitersId: data.inviter_id,
        createdAt: data.created_at,
      };
    });

    expect(result).toEqual({
      data: transformed,
      cursor: null,
      hasNextPage: false,
    });
  });

  it('should revoke a pending invite', async () => {
    const invite = {
      status: InviteStatus.PENDING,
    };

    mockDatabaseService.invite.findUniqueOrThrow.mockResolvedValue(invite);

    const result = await controller.revokeInvite('room-id', 'test-invite-id');

    expect(mockDatabaseService.invite.findUniqueOrThrow).toHaveBeenCalledTimes(
      1,
    );
    expect(mockDatabaseService.invite.delete).toHaveBeenCalledTimes(1);

    expect(result).toEqual({ message: 'success' });
  });

  it('should not revoke the invite if it has been responded to', async () => {
    const invite = {
      status: InviteStatus.ACCEPTED,
    };

    mockDatabaseService.invite.findUniqueOrThrow.mockResolvedValue(invite);

    await expect(
      controller.revokeInvite('room-id', 'test-invite-id'),
    ).rejects.toThrow(BadRequestException);

    expect(mockDatabaseService.invite.findUniqueOrThrow).toHaveBeenCalledTimes(
      1,
    );
    expect(mockDatabaseService.invite.delete).not.toHaveBeenCalled();
  });
});
