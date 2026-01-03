import { Algorithm } from 'jsonwebtoken';

export const DAYS_1 = 60 * 60 * 24;
export const DAYS_1_MS = DAYS_1 * 1000;
export const DAYS_7 = 60 * 60 * 24 * 7;
export const DAYS_7_MS = DAYS_7 * 1000;
export const DAYS_14 = 14 * 24 * 60 * 60;
export const DAYS_14_MS = DAYS_14 * 1000;
export const MINUTES_10 = 10 * 60;
export const MINUTES_10_MS = MINUTES_10 * 1000;
export const MINUTES_5 = 5 * 60;
export const MINUTES_5_MS = MINUTES_5 * 1000;
export const MINUTES_1 = 1 * 60;
export const MINUTES_1_MS = MINUTES_1 * 1000;
export const SECONDS_10 = 10;
export const SECONDS_10_MS = SECONDS_10 * 1000;
export const SECONDS_20 = 20;
export const SECONDS_20_MS = SECONDS_20 * 1000;

export const DEFAULT_JWT_ALG: Algorithm = 'HS256';

export const TOKEN = {
  ACCESS: {
    TYPE: 'access_token' as const,
    EXPIRATION: '10m',
    EXPIRATION_SEC: MINUTES_10,
    EXPIRATION_MS: MINUTES_10_MS,
  },
  REFRESH: {
    TYPE: 'refresh_token' as const,
    EXPIRATION: '14d',
    EXPIRATION_SEC: DAYS_14,
    EXPIRATION_MS: DAYS_14_MS,
  },
} as const;

export const MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  NOT_FOUND: 'Not Exist',
};
