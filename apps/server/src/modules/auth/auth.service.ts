import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

import { v4 as uuid } from 'uuid';

import { RedisService } from '../../core/redis/redis.service';
import { DatabaseService } from '../../core/database/database.service';
import { AppConfigService } from '../../core/app-config/app-config.service';

import { MESSAGES, MINUTES_1, TOKEN } from '../../common/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: AppConfigService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async authorize() {
    const state = crypto.randomBytes(32).toString('hex');

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const response_type = 'code';

    const { success, data, error } = this.configService.GOOGLE_CLIENT_ID;

    if (!success) {
      console.error(error);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    if (!this.configService.BASE_URL.success) {
      console.error(this.configService.BASE_URL.error);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const redirect_uri =
      this.configService.BASE_URL.data + '/api/v1/auth/callback';

    const searchParams = new URLSearchParams({
      client_id: data,
      redirect_uri,
      response_type,
      scope: scopes.join(' '),
      state,
    });

    const result = await this.redisService.setInCache(
      `oauth_state:${state}`,
      { timestamp: Date.now() },
      MINUTES_1,
    );

    if (!result.success) {
      console.error('Failed to store state in cache:', result.error);

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;

    return url;
  }

  async callback(state: string, code: string) {
    if (!state || !code) {
      console.error('Invalid state or code');
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const { success, data, error } = await this.redisService.getFromCache(
      `oauth_state:${state}`,
    );

    if (!success) {
      console.error(error);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    if (!data) {
      console.error('Invalid state');
      throw new UnauthorizedException(MESSAGES.UNAUTHORIZED);
    }

    if (
      !this.configService.GOOGLE_CLIENT_SECRET.success ||
      !this.configService.GOOGLE_CLIENT_ID.success ||
      !this.configService.BASE_URL.success
    ) {
      console.error(
        this.configService.GOOGLE_CLIENT_SECRET.error ||
          this.configService.GOOGLE_CLIENT_ID.error ||
          this.configService.BASE_URL.error,
      );

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const url = `https://oauth2.googleapis.com/token`;

    const req = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: this.configService.GOOGLE_CLIENT_ID.data,
        client_secret: this.configService.GOOGLE_CLIENT_SECRET.data,
        redirect_uri:
          this.configService.BASE_URL.data + '/api/v1/auth/callback',
      }),
    });

    const res = (await req.json()) as {
      scope: string;
      id_token: string;
      access_token: string;
      refresh_token: string;
    };

    if (
      !this.configService.JWT_SECRET.success ||
      !this.configService.BASE_URL.success
    ) {
      console.error(
        this.configService.JWT_SECRET.error ||
          this.configService.BASE_URL.error,
      );

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const deleted = await this.redisService.deleteFromCache(
      `oauth_state:${state}`,
    );

    if (!deleted.success) {
      console.error('Failed to delete state from cache:', deleted.error);
    }

    const decodedInfo = this.jwtService.decode<{
      email: string;
      sub: string;
      name: string;
      picture?: string;
      iss: string;
      auth_time: string;
    }>(res.id_token);

    let userInfo = await this.databaseService.users.findUnique({
      where: {
        email: decodedInfo.email,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!userInfo) {
      userInfo = await this.databaseService.users.create({
        data: {
          name: decodedInfo.name,
          email: decodedInfo.email,
          picture: decodedInfo.picture,
          accounts: {
            create: {
              provider: 'google',
              provider_id: decodedInfo.sub,
            },
          },
        },
        select: {
          id: true,
          email: true,
        },
      });
    }

    const accessTokenId = uuid();
    const refreshTokenId = uuid();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId: userInfo.id,
          email: userInfo.email,
        },
        {
          jwtid: accessTokenId,
          expiresIn: TOKEN.ACCESS.EXPIRATION,
        },
      ),
      this.jwtService.signAsync(
        {
          userId: userInfo.id,
          email: userInfo.email,
        },
        {
          jwtid: refreshTokenId,
          expiresIn: TOKEN.REFRESH.EXPIRATION,
        },
      ),
    ]);

    await this.databaseService.refreshTokens.create({
      data: {
        token_id: refreshTokenId,
        user_id: userInfo.id,
        expires_at: new Date(Date.now() + TOKEN.REFRESH.EXPIRATION_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout() {
    // TODO: Handle logout
  }
}
