import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { PrismaKnownErrorFilter } from '../src/common/filters/prisma-known-error.filter';
import { DatabaseService } from '../src/core/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
  verifyAsync: jest.fn(),
};

const myLoggerMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logError: jest.fn(),
};

const testEmail = 'test-accounts@example.com';
const testAccessTokenId = 'test-accounts-access-token-id';

const accessToken = 'test-accounts-access-token';

describe('AccountsController (e2e)', () => {
  let app: INestApplication<App>;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Logger)
      .useValue(myLoggerMock)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .overrideModule(ThrottlerModule)
      .useModule(
        ThrottlerModule.forRoot({
          throttlers: [{ blockDuration: 0, limit: 0, name: 'test', ttl: 0 }],
        }),
      )
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
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
  });

  afterAll(async () => {
    await databaseService.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  beforeEach(async () => {
    await databaseService.user.deleteMany({
      where: { email: testEmail },
    });
  });

  it('it should not get the user info because they are unauthorized', async () => {
    return request(app.getHttpServer()).get('/accounts/me').expect(401);
  });

  it('it should get the user info', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .get('/accounts/me')
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);
  });

  it('it should not update the users info due to invalid input', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .patch('/accounts/me')
      .set('Cookie', [`access_token=${accessToken}`])
      .send({
        name: '22',
      });

    expect(req.statusCode).toBe(400);
  });

  it('it should update the users info', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .patch('/accounts/me')
      .set('Cookie', [`access_token=${accessToken}`])
      .send({
        name: 'Updated user',
      });

    expect(req.statusCode).toBe(200);
  });

  it('it should delete the users info', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .delete('/accounts/me')
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);
  });
});
