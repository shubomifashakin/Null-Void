import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

import { RedisModule } from '../../core/redis/redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { DatabaseService } from '../../core/database/database.service';
import { RedisService } from '../../core/redis/redis.service';

import { makeOauthStateKey } from '../../common/utils';
import { DEFAULT_JWT_ALG, MINUTES_1 } from '../../common/constants';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

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

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
      imports: [
        AppConfigModule,
        RedisModule,
        DatabaseModule,
        JwtModule.registerAsync({
          inject: [AppConfigService],
          imports: [AppConfigModule],
          useFactory: (appConfigService: AppConfigService) => {
            return {
              secret: appConfigService.JWT_SECRET.data!,
              signOptions: {
                expiresIn: '5m',
                algorithm: DEFAULT_JWT_ALG,
                issuer: appConfigService.BASE_URL.data!,
              },
            };
          },
        }),
      ],
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

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Successful Tests', () => {
    it('should authorize', async () => {
      mockRedisService.setInCache.mockResolvedValue({ success: true });
      const result = await service.authorize();

      expect(mockRedisService.setInCache).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setInCache).toHaveBeenCalledWith(
        expect.stringContaining('oauth_state'),
        { timestamp: expect.any(Number) },
        MINUTES_1,
      );

      expect(result).toBeDefined();
      expect(result).toContain('https://accounts.google.com/o/oauth2/v2/auth');
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

      const result = await service.callback('test-state', 'test-code');

      expect(mockRedisService.getFromCache).toHaveBeenCalledTimes(1);
      expect(mockRedisService.getFromCache).toHaveBeenCalledWith(
        makeOauthStateKey('test-state'),
      );

      expect(mockRedisService.deleteFromCache).toHaveBeenCalledTimes(1);
      expect(mockRedisService.deleteFromCache).toHaveBeenCalledWith(
        makeOauthStateKey('test-state'),
      );

      expect(mockJwtService.decode).toHaveBeenCalledWith('test-id-token');

      expect(mockDatabaseService.refreshTokens.create).toHaveBeenCalledWith({
        data: {
          token_id: expect.any(String),
          user_id: 'test-user-id',
          expires_at: expect.any(Date),
        },
      });

      expect(result).toBeDefined();
      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });
    });
  });

  describe('Unsuccessful Tests', () => {
    it('should not authorize because of redis failed to store state', async () => {
      mockRedisService.setInCache.mockResolvedValue({
        success: false,
        error: 'Failed state',
      });

      await expect(service.authorize()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should not generate the tokens because of invalid state', async () => {
      mockRedisService.getFromCache.mockResolvedValue({
        success: true,
        data: null,
      });

      await expect(service.callback('test-state', 'test-code')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
