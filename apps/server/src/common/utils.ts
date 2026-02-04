import { Transform } from 'class-transformer';
import { IsString, IsUrl, IsNotEmpty, validateSync } from 'class-validator';

export function makeBlacklistedKey(token: string): string {
  return `blacklist:${token}`;
}

export function makeOauthStateKey(token: string): string {
  return `oauth_state:${token}`;
}

export function makeAccountKey(userId: string): string {
  return `account:${userId}`;
}

class EnvConfig {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  QUEUE_REDIS_URL: string;

  @IsUrl({ require_tld: false })
  BASE_URL: string;

  @IsUrl({ require_tld: false })
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  DOMAIN: string;

  @IsString()
  @IsNotEmpty()
  PORT: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\n/g, ''))
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.replace(/\n/g, ''))
  JWT_PUBLIC_KEY: string;

  @IsString()
  @IsNotEmpty()
  SERVICE_NAME: string;

  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  MAILER_FROM: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  LOG_LEVEL: string;

  @IsString()
  @IsNotEmpty()
  NODE_ENV: string;

  @IsString()
  @IsNotEmpty()
  CACHE_REDIS_URL: string;
}

export function validateConfig(config: Record<string, string>) {
  const envConfig = new EnvConfig();
  Object.assign(envConfig, config);

  const errors = validateSync(envConfig);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.toString()).join(', '));
  }
}
