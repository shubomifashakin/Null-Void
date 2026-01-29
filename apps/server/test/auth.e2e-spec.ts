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

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-1234'),
}));

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

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let databaseService: DatabaseService;
  let cookies: string[] = [];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .overrideProvider(Logger)
      .useValue(myLoggerMock)
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

    app.use(cookieParser());
    app.useGlobalFilters(new PrismaKnownErrorFilter());

    await app.init();

    databaseService = moduleFixture.get(DatabaseService);
  });

  afterAll(async () => {
    await databaseService.user.deleteMany();
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/auth').expect(302);
  });

  it('/callback (GET)', async () => {
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        scope: 'test-scope',
        id_token: 'test-id-token',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      }),
    });

    mockJwtService.decode.mockReturnValue({
      email: 'test-email@email.com',
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
      '/auth/callback?state=test-uuid-1234&code=123',
    );

    expect(req.statusCode).toBe(302);

    cookies = req.headers['set-cookie'] as unknown as string[];
  });

  it('/refresh (GET)', async () => {
    mockJwtService.decode.mockReturnValue({
      jti: 'test-uuid-1234',
    });

    mockJwtService.signAsync
      .mockResolvedValueOnce('test-access-token')
      .mockResolvedValueOnce('test-refresh-token');

    const req = await request(app.getHttpServer())
      .get('/auth/refresh')
      .set('Cookie', cookies);

    expect(req.statusCode).toBe(200);
    expect(req.body).toEqual({ message: 'success' });
    expect(req.type).toBe('application/json');
  });

  it('/logout (POST)', async () => {
    mockJwtService.decode.mockReturnValue({
      jti: 'test-uuid-1234',
    });

    mockJwtService.signAsync
      .mockResolvedValueOnce('test-access-token')
      .mockResolvedValueOnce('test-refresh-token');

    const req = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookies);

    expect(req.statusCode).toBe(200);
    expect(req.body).toEqual({ message: 'success' });
    expect(req.type).toBe('application/json');
  });
});
