import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FnResult, makeError } from '../../../types/fnResult';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get DATABASE_URL(): FnResult<string> {
    try {
      const databaseUrl = this.config.getOrThrow<string>('DATABASE_URL');

      return { success: true, data: databaseUrl, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get DOMAIN(): FnResult<string> {
    try {
      const domain = this.config.getOrThrow<string>('DOMAIN');

      return { success: true, data: domain, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get MAILER_FROM(): FnResult<string> {
    try {
      const mailerFrom = this.config.getOrThrow<string>('MAILER_FROM');

      return { success: true, data: mailerFrom, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get RESEND_API_KEY(): FnResult<string> {
    try {
      const resendApiKey = this.config.getOrThrow<string>('RESEND_API_KEY');

      return { success: true, data: resendApiKey, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get GOOGLE_CLIENT_ID(): FnResult<string> {
    try {
      const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');

      return { success: true, data: clientId, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get GOOGLE_CLIENT_SECRET(): FnResult<string> {
    try {
      const clientSecret = this.config.getOrThrow<string>(
        'GOOGLE_CLIENT_SECRET',
      );

      return { success: true, data: clientSecret, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get JWT_SECRET(): FnResult<string> {
    try {
      const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');

      return { success: true, data: jwtSecret, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get BASE_URL(): FnResult<string> {
    try {
      const baseUrl = this.config.getOrThrow<string>('BASE_URL');

      return { success: true, data: baseUrl.trim(), error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get CACHE_REDIS_URL(): FnResult<string> {
    try {
      const baseUrl = this.config.getOrThrow<string>('CACHE_REDIS_URL');

      return { success: true, data: baseUrl.trim(), error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get QUEUE_REDIS_URL(): FnResult<string> {
    try {
      const queueUrl = this.config.getOrThrow<string>('QUEUE_REDIS_URL');

      return { success: true, data: queueUrl.trim(), error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get FRONTEND_URL(): FnResult<string> {
    try {
      const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
      return { success: true, data: frontendUrl.trim(), error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  get SERVICE_NAME(): FnResult<string> {
    try {
      const serviceName = this.config.getOrThrow<string>('SERVICE_NAME');

      return { success: true, data: serviceName.trim(), error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }
}
