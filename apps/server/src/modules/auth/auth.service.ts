import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { v4 as uuid } from 'uuid';

import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';
import { DatabaseService } from '../../core/database/database.service';
import { AppConfigService } from '../../core/app-config/app-config.service';

import { makeBlacklistedKey, makeOauthStateKey } from '../../common/utils';
import {
  DEFAULT_JWT_ALG,
  MESSAGES,
  MINUTES_1,
  TOKEN,
} from '../../common/constants';
import { FnResult, makeError } from '../../types/fnResult';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: AppConfigService,
    private readonly redisService: CacheRedisService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateToken(userInfo: {
    id: string;
  }): Promise<FnResult<{ accessToken: string; refreshToken: string }>> {
    try {
      const accessTokenId = uuid();
      const refreshTokenId = uuid();

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          {
            userId: userInfo.id,
          },
          {
            algorithm: DEFAULT_JWT_ALG,
            jwtid: accessTokenId,
            expiresIn: TOKEN.ACCESS.EXPIRATION,
          },
        ),
        this.jwtService.signAsync(
          {
            userId: userInfo.id,
          },
          {
            algorithm: DEFAULT_JWT_ALG,
            jwtid: refreshTokenId,
            expiresIn: TOKEN.REFRESH.EXPIRATION,
          },
        ),
      ]);

      await this.databaseService.refreshToken.create({
        data: {
          token_id: refreshTokenId,
          user_id: userInfo.id,
          expires_at: new Date(Date.now() + TOKEN.REFRESH.EXPIRATION_MS),
        },
      });

      return {
        success: true,
        data: { accessToken, refreshToken },
        error: null,
      };
    } catch (error) {
      return { success: false, error: makeError(error), data: null };
    }
  }

  async authorize() {
    const state = uuid();

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const response_type = 'code';

    const { success, data, error } = this.configService.GOOGLE_CLIENT_ID;

    if (!success) {
      this.logger.error(error);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    if (!this.configService.BASE_URL.success) {
      this.logger.error(this.configService.BASE_URL.error);
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
      makeOauthStateKey(state),
      { timestamp: Date.now() },
      MINUTES_1,
    );

    if (!result.success) {
      this.logger.error(result.error);

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;

    return url;
  }

  async callback(state: string, code: string) {
    if (!state || !code) {
      this.logger.error('Invalid state or code');
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const { success, data, error } = await this.redisService.getFromCache(
      makeOauthStateKey(state),
    );

    if (!success) {
      this.logger.error(error);
      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    if (!data) {
      this.logger.error('Invalid state');
      throw new UnauthorizedException(MESSAGES.UNAUTHORIZED);
    }

    if (
      !this.configService.GOOGLE_CLIENT_SECRET.success ||
      !this.configService.GOOGLE_CLIENT_ID.success ||
      !this.configService.BASE_URL.success
    ) {
      this.logger.error(
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
      this.logger.error(
        this.configService.JWT_SECRET.error ||
          this.configService.BASE_URL.error,
      );

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const deleted = await this.redisService.deleteFromCache(
      makeOauthStateKey(state),
    );

    if (!deleted.success) {
      this.logger.error(deleted.error);
    }

    const decodedInfo = this.jwtService.decode<{
      email: string;
      sub: string;
      name: string;
      picture?: string;
      iss: string;
      auth_time: string;
    }>(res.id_token);

    let userInfo = await this.databaseService.user.findUnique({
      where: {
        email: decodedInfo.email,
      },
      select: {
        id: true,
      },
    });

    if (!userInfo) {
      userInfo = await this.databaseService.user.create({
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
          name: true,
          picture: true,
        },
      });
    }

    const {
      data: tokens,
      error: tokensError,
      success: tokenSuccess,
    } = await this.generateToken(userInfo);

    if (!tokenSuccess) {
      this.logger.error(tokensError);

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    return tokens;
  }

  async logout(accessToken: string, refreshToken: string) {
    const accessTokenId = this.jwtService.decode<{ jti: string }>(
      accessToken,
    )?.jti;

    if (accessTokenId) {
      const { success, error } = await this.redisService.setInCache(
        makeBlacklistedKey(accessTokenId),
        true,
        TOKEN.ACCESS.EXPIRATION_SEC,
      );

      if (!success) {
        this.logger.error(error);
      }
    }

    const refreshTokenId = this.jwtService.decode<{ jti: string }>(
      refreshToken,
    )?.jti;

    if (!refreshTokenId) {
      return { message: 'success' };
    }

    const refreshExists = await this.databaseService.refreshToken.findUnique({
      where: {
        token_id: refreshTokenId,
      },
    });

    if (!refreshExists) {
      return { message: 'success' };
    }

    await this.databaseService.refreshToken.delete({
      where: {
        token_id: refreshTokenId,
      },
    });

    return { message: 'success' };
  }

  async refresh(refreshToken: string) {
    const refreshTokenId = this.jwtService.decode<{ jti: string }>(
      refreshToken,
    )?.jti;

    if (!refreshTokenId) {
      throw new UnauthorizedException(MESSAGES.UNAUTHORIZED);
    }

    const refreshExists = await this.databaseService.refreshToken.findUnique({
      where: {
        token_id: refreshTokenId,
      },
      select: {
        user: {
          select: {
            id: true,
          },
        },
        expires_at: true,
      },
    });

    if (!refreshExists) {
      throw new UnauthorizedException(MESSAGES.UNAUTHORIZED);
    }

    await this.databaseService.refreshToken.delete({
      where: {
        token_id: refreshTokenId,
      },
    });

    if (new Date() > refreshExists.expires_at) {
      throw new UnauthorizedException(MESSAGES.UNAUTHORIZED);
    }

    const {
      data: tokens,
      error: tokensError,
      success: tokenSuccess,
    } = await this.generateToken({
      id: refreshExists.user.id,
    });

    if (!tokenSuccess) {
      this.logger.error(tokensError);

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }

    return tokens;
  }
}
