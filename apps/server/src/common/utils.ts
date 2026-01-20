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
  REDIS_CACHE_URL: string;

  @IsUrl()
  BASE_URL: string;

  @IsUrl()
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  DOMAIN: string;

  @IsString()
  @IsNotEmpty()
  PORT: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

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
  REDIS_QUEUE_URL: string;
}

export function validateConfig(config: Record<string, string>) {
  const envConfig = new EnvConfig();
  Object.assign(envConfig, config);

  const errors = validateSync(envConfig);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.toString()).join(', '));
  }
}
