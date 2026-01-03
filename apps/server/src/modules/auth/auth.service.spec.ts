import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

import { RedisModule } from '../../core/redis/redis.module';
import { DatabaseModule } from '../../core/database/database.module';
import { AppConfigModule } from '../../core/app-config/app-config.module';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { DatabaseService } from '../../core/database/database.service';
import { RedisService } from '../../core/redis/redis.service';

import { DEFAULT_JWT_ALG } from '../../common/constants';

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
  BASE_URL: { status: true, data: 'test-base-url' },
  JWT_SECRET: { status: true, data: 'test-jwt-secret' },
  GOOGLE_CLIENT_ID: { status: true, data: 'test-client-id' },
  GOOGLE_CLIENT_SECRET: { status: true, data: 'test-client-secret' },
};

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
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
