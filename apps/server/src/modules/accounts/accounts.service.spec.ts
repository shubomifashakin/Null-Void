import { JwtService } from '@nestjs/jwt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { AccountsService } from './accounts.service';

import { makeAccountKey } from '../../common/utils';
import { CacheRedisModule } from '../../core/cache-redis/cache-redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { DatabaseService } from '../../core/database/database.service';
import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { QueueRedisModule } from '../../core/queue-redis/queue-redis.module';
import { QueueRedisService } from '../../core/queue-redis/queue-redis.service';

const mockDatabaseService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  invite: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
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
  GOOGLE_CLIENT_ID: { success: true, data: 'test-client-id' },
  GOOGLE_CLIENT_SECRET: { success: true, data: 'test-client-secret' },
};

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
};

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsService],
      imports: [
        DatabaseModule,
        CacheRedisModule,
        AppConfigModule,
        QueueRedisModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(CacheRedisService)
      .useValue(mockRedisService)
      .overrideProvider(QueueRedisService)
      .useValue(mockQueueRedisService)
      .overrideProvider(AppConfigService)
      .useValue(mockConfigService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    service = module.get<AccountsService>(AccountsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Successful Tests', () => {
    it('should get the account', async () => {
      mockRedisService.getFromCache.mockResolvedValue({
        success: true,
        data: null,
      });

      const user = {
        id: 'test-user-id',
        email: 'test-email@email.com',
        name: 'test-name',
        picture: 'test-picture',
        created_at: new Date(),
      };

      mockDatabaseService.user.findUnique.mockResolvedValue(user);

      mockRedisService.setInCache.mockResolvedValue({
        success: true,
      });

      const result = await service.getAccount('test-user-id');

      expect(result).toBeDefined();
      expect(result).toEqual(user);
    });

    it('should get the account from cache', async () => {
      const user = {
        id: 'test-user-id',
        email: 'test-email@email.com',
        name: 'test-name',
        picture: 'test-picture',
        created_at: new Date(),
      };

      mockRedisService.getFromCache.mockResolvedValue({
        success: true,
        data: user,
      });

      const result = await service.getAccount('test-user-id');

      expect(result).toBeDefined();
      expect(result).toEqual(user);

      expect(mockDatabaseService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should update the account', async () => {
      const user = {
        id: 'test-user-id',
        email: 'test-email@email.com',
        name: 'test-name',
        picture: 'test-picture',
        created_at: new Date(),
      };

      mockDatabaseService.user.update.mockResolvedValue(user);

      mockRedisService.setInCache.mockResolvedValue({
        success: true,
      });

      const result = await service.updateAccount('test-user-id', {
        name: 'test-name',
      });

      expect(result).toBeDefined();
      expect(result).toEqual({ message: 'success' });
    });

    it('should delete the account', async () => {
      mockDatabaseService.user.delete.mockResolvedValue(null);

      mockRedisService.deleteFromCache.mockResolvedValue({
        success: true,
      });

      const result = await service.deleteAccount('test-user-id');

      expect(result).toBeDefined();
      expect(result).toEqual({ message: 'success' });
      expect(mockRedisService.deleteFromCache).toHaveBeenCalledWith(
        makeAccountKey('test-user-id'),
      );
    });

    it('should update the invite', async () => {
      mockDatabaseService.invite.findUniqueOrThrow.mockResolvedValue({
        status: 'PENDING',
      });
      mockDatabaseService.invite.update.mockResolvedValue(true);

      const inviteId = 'test-invite-id';
      await service.updateInvite(inviteId, 'ACCEPTED');

      expect(mockDatabaseService.invite.findUniqueOrThrow).toHaveBeenCalledWith(
        {
          where: {
            id: inviteId,
          },
          select: {
            status: true,
          },
        },
      );
      expect(mockDatabaseService.invite.update).toHaveBeenCalledWith({
        where: {
          id: inviteId,
        },
        data: {
          status: 'ACCEPTED',
        },
      });
    });
  });

  describe('Unsuccessful Tests', () => {
    it('should not get the account because the account was not found', async () => {
      mockRedisService.getFromCache.mockResolvedValue({
        success: true,
        data: null,
      });

      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.getAccount('test-user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update the account because the account was not found', async () => {
      mockDatabaseService.user.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Invalid', {
          code: 'P2025',
          clientVersion: '7.2',
        }),
      );

      await expect(
        service.updateAccount('test-user-id', {
          name: 'test-name',
        }),
      ).rejects.toThrow(PrismaClientKnownRequestError);
    });

    it('should not delete the account because the account was not found', async () => {
      mockDatabaseService.user.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Invalid', {
          code: 'P2025',
          clientVersion: '7.2',
        }),
      );

      await expect(service.deleteAccount('test-user-id')).rejects.toThrow(
        PrismaClientKnownRequestError,
      );
    });

    it('should not update the invite because it was already updated', async () => {
      mockDatabaseService.invite.findUniqueOrThrow.mockResolvedValue({
        status: 'ACCEPTED',
      });
      mockDatabaseService.invite.update.mockResolvedValue(true);

      const inviteId = 'test-invite-id';
      await expect(service.updateInvite(inviteId, 'ACCEPTED')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
