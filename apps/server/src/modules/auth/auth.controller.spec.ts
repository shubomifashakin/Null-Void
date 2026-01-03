/* eslint-disable @typescript-eslint/unbound-method */
import { Response, Request } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { RedisModule } from '../../core/redis/redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { TOKEN } from '../../common/constants';
import { DatabaseService } from '../../core/database/database.service';
import { RedisService } from '../../core/redis/redis.service';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

const mockResponse = {
  cookie: jest.fn(),
  status: jest.fn(),
  json: jest.fn(),
  clearCookie: jest.fn(),
  redirect: jest.fn(),
} as unknown as jest.Mocked<Response>;

const mockRequest = {
  cookies: {
    [TOKEN.ACCESS.TYPE]: 'test-access-token',
    [TOKEN.REFRESH.TYPE]: 'test-refresh-token',
  },
} as unknown as jest.Mocked<Request>;

const mockDatabaseService = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshTokens: {
    findUnique: jest.fn(),
    create: jest.fn(),
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
  FRONTEND_URL: { success: true, data: 'test-frontend-url' },
  DOMAIN: { success: true, data: 'test-domain' },
  JWT_SECRET: { success: true, data: 'test-jwt-secret' },
  GOOGLE_CLIENT_ID: { success: true, data: 'test-client-id' },
  GOOGLE_CLIENT_SECRET: { success: true, data: 'test-client-secret' },
};

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [AppConfigModule, RedisModule, DatabaseModule, JwtModule],
      providers: [AuthService],
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

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Successful Tests', () => {
    it('should authorize', async () => {
      mockRedisService.setInCache.mockResolvedValue({ success: true });
      await controller.authorize(mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('https://accounts.google.com/o/oauth2/v2/auth'),
      );
    });

    it('should generate the tokens', async () => {
      mockRedisService.getFromCache.mockResolvedValue({
        success: true,
        data: { timestamp: Date.now() },
      });

      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          scope: 'test-scope',
          id_token: 'test-id-token',
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        }),
      });

      mockRedisService.deleteFromCache.mockResolvedValue({
        success: true,
      });

      mockJwtService.decode.mockReturnValue({
        email: 'test-email@email.com',
        sub: 'test-sub',
        name: 'test-name',
        picture: 'test-picture',
        iss: 'test-iss',
        auth_time: 'test-auth-time',
      });

      mockDatabaseService.users.findUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'test-email@email.com',
      });

      mockJwtService.signAsync
        .mockResolvedValueOnce('test-access-token')
        .mockResolvedValueOnce('test-refresh-token');

      mockDatabaseService.refreshTokens.create.mockResolvedValue(null);

      await controller.callback(mockResponse, 'test-state', 'test-code');

      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining('test-frontend-url'),
      );
    });

    it('should logout the user', async () => {
      mockJwtService.decode
        .mockReturnValueOnce({
          jti: 'test-access-tji',
        })
        .mockReturnValueOnce({
          jti: 'test-refresh-tji',
        });

      mockRedisService.setInCache.mockResolvedValue({ success: true });

      mockDatabaseService.refreshTokens.findUnique.mockResolvedValue({
        token_id: 'test-refresh-tji',
      });

      mockDatabaseService.refreshTokens.delete.mockResolvedValue(null);

      const result = await controller.logout(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      expect(result).toEqual({
        message: 'success',
      });
    });

    it('should logout the user successfuly if refresh token does not exist in db', async () => {
      mockJwtService.decode
        .mockReturnValueOnce({
          jti: 'test-access-tji',
        })
        .mockReturnValueOnce({
          jti: 'test-refresh-tji',
        });

      mockRedisService.setInCache.mockResolvedValue({ success: true });

      mockDatabaseService.refreshTokens.findUnique.mockResolvedValue(null);

      const result = await controller.logout(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      expect(result).toEqual({
        message: 'success',
      });
    });

    it('should refresh the tokens', async () => {
      mockJwtService.decode.mockReturnValueOnce({
        jti: 'test-refresh-tji',
      });

      mockDatabaseService.refreshTokens.findUnique.mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: 'test-email@email.com',
        },
        expires_at: new Date(Date.now() * 10),
      });

      mockDatabaseService.refreshTokens.delete.mockResolvedValue(null);

      mockJwtService.signAsync
        .mockResolvedValueOnce('test-access-token')
        .mockResolvedValueOnce('test-refresh-token');

      mockDatabaseService.refreshTokens.create.mockResolvedValue(null);

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);

      expect(result).toBeDefined();
      expect(result).toEqual({
        message: 'success',
      });
    });
  });

  describe('Unsuccessful Tests', () => {
    it('should not authorize because of redis failed to store state', async () => {
      mockRedisService.setInCache.mockResolvedValue({
        success: false,
        error: 'Failed state',
      });

      await expect(controller.authorize(mockResponse)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should not generate the tokens because of invalid state', async () => {
      mockRedisService.getFromCache.mockResolvedValue({
        success: true,
        data: null,
      });

      await expect(
        controller.callback(mockResponse, 'test-state', 'test-code'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not refresh the tokens because of invalid refresh token', async () => {
      mockJwtService.decode.mockReturnValueOnce({
        jti_invalid: 'test-refresh-tji',
      });

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not refresh the tokens because refresh token did not exist in db', async () => {
      mockJwtService.decode.mockReturnValueOnce({
        jti: 'test-refresh-tji',
      });

      mockDatabaseService.refreshTokens.findUnique.mockResolvedValue(null);

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not refresh the tokens because refresh token has expired', async () => {
      mockJwtService.decode.mockReturnValueOnce({
        jti: 'test-refresh-tji',
      });

      mockDatabaseService.refreshTokens.findUnique.mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: 'test-email@email.com',
        },
        expires_at: new Date(1000),
      });

      mockDatabaseService.refreshTokens.delete.mockResolvedValue(null);

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
