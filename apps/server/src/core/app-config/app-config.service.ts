import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FnResult } from 'types/fnResult';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get DATABASE_URL(): FnResult<string> {
    try {
      const databaseUrl = this.config.getOrThrow<string>('DATABASE_URL');

      return { success: true, data: databaseUrl, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'DATABASE_URL is not defined in .env',
      };
    }
  }

  get DOMAIN(): FnResult<string> {
    try {
      const domain = this.config.getOrThrow<string>('DOMAIN');

      return { success: true, data: domain, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'DOMAIN is not defined in .env',
      };
    }
  }

  get RESEND_API_KEY(): FnResult<string> {
    try {
      const resendApiKey = this.config.getOrThrow<string>('RESEND_API_KEY');

      return { success: true, data: resendApiKey, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'RESEND_API_KEY is not defined in .env',
      };
    }
  }

  get GOOGLE_CLIENT_ID(): FnResult<string> {
    try {
      const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');

      return { success: true, data: clientId, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'GOOGLE_CLIENT_ID is not defined in .env',
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
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'GOOGLE_CLIENT_SECRET is not defined in .env',
      };
    }
  }

  get JWT_SECRET(): FnResult<string> {
    try {
      const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');

      return { success: true, data: jwtSecret, error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'JWT_SECRET is not defined in .env',
      };
    }
  }

  get BASE_URL(): FnResult<string> {
    try {
      const baseUrl = this.config.getOrThrow<string>('BASE_URL');

      return { success: true, data: baseUrl.trim(), error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'BASE_URL is not defined in .env',
      };
    }
  }

  get REDIS_URL(): FnResult<string> {
    try {
      const baseUrl = this.config.getOrThrow<string>('REDIS_URL');

      return { success: true, data: baseUrl.trim(), error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'REDIS_URL is not defined in .env',
      };
    }
  }

  get FRONTEND_URL(): FnResult<string> {
    try {
      const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
      return { success: true, data: frontendUrl.trim(), error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'FRONTEND_URL is not defined in .env',
      };
    }
  }

  get SERVICE_NAME(): FnResult<string> {
    try {
      const serviceName = this.config.getOrThrow<string>('SERVICE_NAME');

      return { success: true, data: serviceName.trim(), error: null };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          data: null,
          error: `${error.name}: ${error.message}`,
        };
      }

      return {
        success: false,
        data: null,
        error: 'SERVICE_NAME is not defined in .env',
      };
    }
  }
}
