import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type FnResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

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
        error: 'DATABASE_URL is not defined',
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
        error: 'RESEND_API_KEY is not defined',
      };
    }
  }
}
