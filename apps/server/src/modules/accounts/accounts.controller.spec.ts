import { Request, Response } from 'express';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { CacheRedisModule } from '../../core/cache-redis/cache-redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { DatabaseService } from '../../core/database/database.service';
import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { QueueRedisModule } from '../../core/queue-redis/queue-redis.module';
import { QueueRedisService } from '../../core/queue-redis/queue-redis.service';

const mockResponse = {
  clearCookie: jest.fn(),
} as unknown as Response;

const mockRequest = {
  user: {
    id: 'test-user-id',
  },
} as unknown as Request;

const mockDatabaseService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
  DOMAIN: { success: true, data: 'test-domain' },
};

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
};

describe('AccountsController', () => {
  let controller: AccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [AccountsService],
      imports: [
        DatabaseModule,
        CacheRedisModule,
        AppConfigModule,
        JwtModule,
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

    controller = module.get<AccountsController>(AccountsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      const result = await controller.getAccount(mockRequest);

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

      const result = await controller.getAccount(mockRequest);

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

      const result = await controller.updateAccount(mockRequest, {
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

      const result = await controller.deleteAccount(mockRequest, mockResponse);

      expect(result).toBeDefined();
      expect(result).toEqual({ message: 'success' });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('Unsuccessful Tests', () => {
    it('should not get the account because the account was not found', async () => {
      mockRedisService.getFromCache.mockResolvedValue({
        success: true,
        data: null,
      });

      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(controller.getAccount(mockRequest)).rejects.toThrow(
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
        controller.updateAccount(mockRequest, {
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

      await expect(
        controller.deleteAccount(mockRequest, mockResponse),
      ).rejects.toThrow(PrismaClientKnownRequestError);
    });
  });
});
