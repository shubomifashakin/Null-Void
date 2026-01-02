import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  callback() {
    console.log('callback');
    // TODO: Handle OAuth callback
    //confirm the state received is the one we generated
    //if it is we make a request with the code received and send it to the token endpoint
  }

  logout() {
    // TODO: Handle logout
  }
}
