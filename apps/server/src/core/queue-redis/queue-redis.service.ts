import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DAYS_1, SECONDS_20_MS } from '../../common/constants';
import { AppConfigService } from '../app-config/app-config.service';

import { createClient, RedisClientType, RESP_TYPES, SetOptions } from 'redis';
import { FnResult, makeError } from '../../types/fnResult';

@Injectable()
export class QueueRedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private logger = new Logger(QueueRedisService.name);

  constructor(configService: AppConfigService) {
    const redisUrl = configService.QUEUE_REDIS_URL;
    const serviceName = configService.SERVICE_NAME;

    if (!redisUrl.success) {
      throw redisUrl.error;
    }

    if (!serviceName.success) {
      throw serviceName.error;
    }

    this.client = createClient({
      pingInterval: SECONDS_20_MS,
      url: redisUrl.data,
      name: serviceName.data + '-queue',
      disableOfflineQueue: true,
      maintNotifications: 'disabled',
      commandOptions: { timeout: 15000 },
      socket: { keepAliveInitialDelay: 5000 },
    });
  }

  getClient() {
    return this.client;
  }

  async onModuleInit() {
    await this.client.connect();

    this.client.on('error', (err: unknown) => {
      this.logger.error({ message: 'Redis connection error:', error: err });
    });
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      this.client.destroy();
    }
  }

  /**
   *
   * @param key identifier
   * @param data data to store
   * @param exp in seconds
   */
  async setInCache(
    key: string,
    data: any,
    exp: number = DAYS_1,
    condition?: SetOptions['condition'],
  ): Promise<FnResult<boolean>> {
    try {
      const result = await this.client.set(key, JSON.stringify(data), {
        expiration: { type: 'EX', value: exp },
        condition,
      });

      if (result === 'OK') {
        return { success: true, data: true, error: null };
      }

      return { success: true, data: false, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  /**
   *
   * @param key identifier
   * @param data data to store
   * @param exp in seconds
   */
  async setInCacheNoStringify(
    key: string,
    data: any,
    exp: number = DAYS_1,
    condition?: SetOptions['condition'],
  ): Promise<FnResult<boolean>> {
    try {
      const result = await this.client.set(key, data, {
        expiration: { type: 'EX', value: exp },
        condition,
      });

      if (result === 'OK') {
        return { success: true, data: true, error: null };
      }

      return { success: true, data: false, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async getFromCache<T>(key: string): Promise<FnResult<T | null>> {
    try {
      const data = await this.client.get(key);

      return {
        success: true,
        data: data ? (JSON.parse(data) as T) : null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async getFromCacheNoParse<T>(key: string): Promise<FnResult<T | null>> {
    try {
      const data = await this.client.sendCommand(['GET', key], {
        typeMapping: {
          [RESP_TYPES.BLOB_STRING]: Buffer,
        },
      });

      return {
        success: true,
        data: data ? (data as T) : null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async hSetInCache(
    key: string,
    field: string,
    value: any,
    exp: number,
  ): Promise<FnResult<null>> {
    try {
      await this.client.hSet(key, field, JSON.stringify(value));
      await this.client.expire(key, exp);

      return { success: true, data: null, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async hSetObjInCache(
    key: string,
    obj: Record<string, any>,
  ): Promise<FnResult<null>> {
    try {
      await this.client.hSet(key, obj);

      await this.client.expire(key, DAYS_1);

      return { success: true, data: null, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async hGetFromCache<T>(
    key: string,
    field: string,
  ): Promise<FnResult<T | null>> {
    try {
      const data = await this.client.hGet(key, field);

      return {
        success: true,
        data: data ? (JSON.parse(data) as T) : null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async hDeleteFromCache(key: string, field: string): Promise<FnResult<null>> {
    try {
      await this.client.hDel(key, field);

      return { success: true, data: null, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async hGetAllFromCache<T>(key: string): Promise<FnResult<Record<string, T>>> {
    try {
      const data = await this.client.hGetAll(key);

      const parsed: Record<string, T> = {};
      for (const [field, value] of Object.entries(data)) {
        parsed[field] = JSON.parse(value) as T;
      }

      return { success: true, data: parsed, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async hLenFromCache(key: string): Promise<FnResult<number>> {
    try {
      const data = await this.client.hLen(key);

      return { success: true, data, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }

  async deleteFromCache(key: string): Promise<FnResult<null>> {
    try {
      await this.client.del(key);

      return { success: true, data: null, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: makeError(error),
      };
    }
  }
}
