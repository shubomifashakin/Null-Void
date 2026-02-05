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
import { CacheRedisService } from '../src/core/cache-redis/cache-redis.service';
import { MailerService } from '../src/core/mailer/mailer.service';

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

const myMailerServiceMock = {
  sendMail: jest.fn().mockResolvedValue({ success: true, error: null }),
};

const mockCacheRedisService = {
  increment: jest.fn().mockResolvedValue({
    success: true,
    totalHits: 0,
    timeToExpire: 1000,
  }),
  getFromCache: jest.fn().mockResolvedValue({ success: true, data: null }),
  setInCache: jest.fn().mockResolvedValue({ success: true }),
  deleteFromCache: jest.fn().mockResolvedValue({ success: true }),
};

const testEmail = 'test-rooms@example.com';
const testAccessTokenId = 'test-rooms-access-token-id';

const accessToken = 'test-rooms-access-token';

describe('RoomsController (e2e)', () => {
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
      .overrideProvider(CacheRedisService)
      .useValue(mockCacheRedisService)
      .overrideProvider(MailerService)
      .useValue(myMailerServiceMock)
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

  it('it should not create a room because user is unauthorized', async () => {
    return request(app.getHttpServer()).post('/rooms').expect(401);
  });

  it('it should not create the room because name is too short', async () => {
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
      .post('/rooms')
      .send({ name: 'Te', description: 'Test Room Description' })
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(400);
  });

  it('it should create the room', async () => {
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
      .post('/rooms')
      .send({ name: 'Test room', description: 'Test Room Description' })
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);
  });

  it('it should get the rooms the user belongs to', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'ADMIN',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .get('/rooms')
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);
    expect(req.body).toEqual({
      data: expect.any(Array),
      hasNextPage: false,
      cursor: null,
    });
    expect(req.body.data).toHaveLength(1);

    await databaseService.room.delete({
      where: {
        id: roomInfo.id,
      },
    });
  });

  it('it should update the created room', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'ADMIN',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .patch(`/rooms/${roomInfo.id}`)
      .send({
        name: 'Updated room',
        description: 'Updated Room Description',
      })
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);

    await databaseService.room.delete({
      where: {
        id: roomInfo.id,
      },
    });
  });

  it('it should not update the created room if the user is not an admin', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'EDITOR',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .patch(`/rooms/${roomInfo.id}`)
      .send({
        name: 'Updated room',
        description: 'Updated Room Description',
      })
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(403);

    await databaseService.room.delete({
      where: {
        id: roomInfo.id,
      },
    });
  });

  it('it should delete the created room', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'ADMIN',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .delete(`/rooms/${roomInfo.id}`)
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);
  });

  it('it should not delete the created room if the user is not an admin', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'EDITOR',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .delete(`/rooms/${roomInfo.id}`)
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(403);
  });

  it('it should get the invites for the room', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'ADMIN',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .get(`/rooms/${roomInfo.id}/invites`)
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);

    expect(req.body).toEqual({
      data: expect.any(Array),
      hasNextPage: false,
      cursor: null,
    });
    expect(req.body.data).toHaveLength(0);
  });

  it('it should invite the user to the room', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'ADMIN',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .post(`/rooms/${roomInfo.id}/invites`)
      .send({ email: 'test@example.com', role: 'EDITOR' })
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);
  });

  it('it should not invite the user to the room if the user is not an admin', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'EDITOR',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .post(`/rooms/${roomInfo.id}/invites`)
      .send({ email: 'test@example.com', role: 'EDITOR' })
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(403);
  });

  it('it should revoke the invite', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'ADMIN',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    const invite = await databaseService.invite.create({
      data: {
        role: 'EDITOR',
        room_id: roomInfo.id,
        email: 'fakeEmail@email.com',
        inviter_id: user.id,
        expires_at: new Date(),
      },
      select: {
        room: {
          select: {
            name: true,
          },
        },
        id: true,
        expires_at: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .delete(`/rooms/${roomInfo.id}/invites/${invite.id}`)
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(200);
  });

  it('it should not revoke the invite if the user is not an admin', async () => {
    const user = await databaseService.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
      },
    });

    const roomInfo = await databaseService.room.create({
      data: {
        owner_id: user.id,
        name: 'Test room',
        description: 'Test Room Description',
        members: {
          create: {
            role: 'EDITOR',
            user_id: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    const invite = await databaseService.invite.create({
      data: {
        role: 'EDITOR',
        room_id: roomInfo.id,
        email: 'fakeEmail@email.com',
        inviter_id: user.id,
        expires_at: new Date(),
      },
      select: {
        room: {
          select: {
            name: true,
          },
        },
        id: true,
        expires_at: true,
      },
    });

    mockJwtService.verifyAsync.mockResolvedValue({
      jti: testAccessTokenId,
      userId: user.id,
    });

    const req = await request(app.getHttpServer())
      .delete(`/rooms/${roomInfo.id}/invites/${invite.id}`)
      .set('Cookie', [`access_token=${accessToken}`]);

    expect(req.statusCode).toBe(403);
  });
});
