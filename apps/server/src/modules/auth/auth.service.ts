import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

import { DatabaseService } from '../../core/database/database.service';
import { AppConfigService } from '../../core/app-config/app-config.service';
import { RedisService } from '../../core/redis/redis.service';

import { MINUTES_1 } from '../../common/constants';

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
      throw new InternalServerErrorException('Internal Server Error');
    }

    if (!this.configService.BASE_URL.success) {
      console.error(this.configService.BASE_URL.error);
      throw new InternalServerErrorException('Internal Server Error');
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

      throw new InternalServerErrorException('Internal server error');
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`;

    return url;
  }

  async callback(state: string, code: string) {
    if (!state || !code) {
      console.error('Invalid state or code');
      throw new InternalServerErrorException('Internal Server Error');
    }

    const { success, data, error } = await this.redisService.getFromCache(
      `oauth_state:${state}`,
    );

    if (!success) {
      console.error(error);
      throw new InternalServerErrorException('Internal Server Error');
    }

    if (!data) {
      console.error('Invalid state');
      throw new UnauthorizedException('Unauthorized');
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

      throw new InternalServerErrorException('Internal Server Error');
    }

    const body = {
      code,
      client_id: this.configService.GOOGLE_CLIENT_ID.data,
      client_secret: this.configService.GOOGLE_CLIENT_SECRET.data,
      redirect_uri: this.configService.BASE_URL.data + '/api/v1/auth/callback',
      grant_type: 'authorization_code',
    };

    const url = `https://oauth2.googleapis.com/token`;

    const req = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
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

      throw new InternalServerErrorException('Internal Server Error');
    }

    const userInfo = this.jwtService.decode<{
      email: string;
      sub: string;
      name: string;
      picture?: string;
      iss: string;
      auth_time: string;
    }>(res.id_token, {
      complete: true,
    });

    console.log(userInfo);

    return userInfo;
  }

  async logout() {
    // TODO: Handle logout
  }
}
