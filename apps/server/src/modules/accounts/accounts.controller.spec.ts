import { Request, Response } from 'express';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { RedisModule } from '../../core/redis/redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { DatabaseService } from '../../core/database/database.service';
import { RedisService } from '../../core/redis/redis.service';
import { AppConfigService } from '../../core/app-config/app-config.service';

const mockResponse = {
  clearCookie: jest.fn(),
} as unknown as Response;

const mockRequest = {
  user: {
    id: 'test-user-id',
  },
} as unknown as Request;

const mockDatabaseService = {
  users: {
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
      imports: [DatabaseModule, RedisModule, AppConfigModule, JwtModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
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

      mockDatabaseService.users.findUnique.mockResolvedValue(user);

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

      expect(mockDatabaseService.users.findUnique).not.toHaveBeenCalled();
    });

    it('should update the account', async () => {
      const user = {
        id: 'test-user-id',
        email: 'test-email@email.com',
        name: 'test-name',
        picture: 'test-picture',
        created_at: new Date(),
      };

      mockDatabaseService.users.update.mockResolvedValue(user);

      mockRedisService.setInCache.mockResolvedValue({
        success: true,
      });

      const result = await controller.updateAccount(mockRequest, {
        name: 'test-name',
      });

      expect(result).toBeDefined();
      expect(result).toEqual(user);
    });

    it('should delete the account', async () => {
      mockDatabaseService.users.delete.mockResolvedValue(null);

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

      mockDatabaseService.users.findUnique.mockResolvedValue(null);

      await expect(controller.getAccount(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update the account because the account was not found', async () => {
      mockDatabaseService.users.update.mockRejectedValue(
        new PrismaClientKnownRequestError('Invalid', {
          code: 'P2025',
          clientVersion: '7.2',
        }),
      );

      await expect(
        controller.updateAccount(mockRequest, {
          name: 'test-name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not delete the account because the account was not found', async () => {
      mockDatabaseService.users.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Invalid', {
          code: 'P2025',
          clientVersion: '7.2',
        }),
      );

      await expect(
        controller.deleteAccount(mockRequest, mockResponse),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
