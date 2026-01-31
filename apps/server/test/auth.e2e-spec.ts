import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../src/core/database/database.service';
import { PrismaKnownErrorFilter } from '../src/common/filters/prisma-known-error.filter';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { CacheRedisService } from '../src/core/cache-redis/cache-redis.service';
import { makeOauthStateKey } from '../src/common/utils';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
};

const myLoggerMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logError: jest.fn(),
};

const testEmail = 'test-auth@example.com';
const testRefreshTokenId = 'test-refresh-token-id';
const testAccessTokenId = 'test-access-token-id';

const refreshToken = 'test-refresh-token';
const accessToken = 'test-access-token';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let databaseService: DatabaseService;
  let redisService: CacheRedisService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Logger)
      .useValue(myLoggerMock)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        stopAtFirstError: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useLogger(app.get(Logger));

    app.use(cookieParser());
    app.useGlobalFilters(new PrismaKnownErrorFilter());

    await app.init();

    databaseService = moduleFixture.get(DatabaseService);
    // jwtService = moduleFixture.get(JwtService);
    redisService = moduleFixture.get(CacheRedisService);
  });

  beforeEach(async () => {
    await databaseService.user.deleteMany({
      where: { email: testEmail },
    });

    await databaseService.refreshToken.deleteMany({
      where: { token_id: testRefreshTokenId },
    });
  });

  afterAll(async () => {
    await databaseService.user.deleteMany();
    await app.close();
  });

  it('/ (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/auth');

    expect(res.status).toBe(302);
  });

  it('/callback (GET)', async () => {
    const state = 'test-uuid-1234';

    await redisService.setInCache(
      makeOauthStateKey(state),
      { timestamp: Date.now() },
      60 * 1000,
    );

    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        scope: 'test-scope',
        id_token: 'test-id-token',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      }),
    });

    mockJwtService.decode.mockReturnValue({
      email: testEmail,
      sub: 'test-sub',
      name: 'test-name',
      picture: 'test-picture',
      iss: 'test-iss',
      auth_time: 'test-auth-time',
    });

    mockJwtService.signAsync
      .mockResolvedValueOnce('test-access-token')
      .mockResolvedValueOnce('test-refresh-token');

    const req = await request(app.getHttpServer()).get(
      `/auth/callback?state=${state}&code=123`,
    );

    expect(req.statusCode).toBe(302);
  });

  it('/refresh (GET)', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'test-name',
        picture: 'test-picture',
      },
    });

    await databaseService.refreshToken.create({
      data: {
        token_id: testRefreshTokenId,
        user_id: user.id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    mockJwtService.decode.mockReturnValue({
      jti: testRefreshTokenId,
    });

    const req = await request(app.getHttpServer())
      .get('/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(req.statusCode).toBe(200);
    expect(req.body).toEqual({ message: 'success' });
    expect(req.type).toBe('application/json');
  });

  it('/logout (POST)', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'test-name',
        picture: 'test-picture',
      },
    });

    await databaseService.refreshToken.create({
      data: {
        token_id: testRefreshTokenId,
        user_id: user.id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    mockJwtService.decode
      .mockReturnValue({
        jti: testRefreshTokenId,
      })
      .mockReturnValueOnce({
        jti: testAccessTokenId,
      });

    const req = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', [
        `refreshToken=${refreshToken}`,
        `accessToken=${accessToken}`,
      ]);

    expect(req.statusCode).toBe(200);
    expect(req.body).toEqual({ message: 'success' });
    expect(req.type).toBe('application/json');
  });
});
