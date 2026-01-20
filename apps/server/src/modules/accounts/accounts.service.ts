import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UpdateAccountDto } from './dtos/update-account.dto';

import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';
import { DatabaseService } from '../../core/database/database.service';

import { MESSAGES } from '../../common/constants';
import { makeAccountKey } from '../../common/utils';

type CachedUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  created_at: Date;
};

@Injectable()
export class AccountsService {
  logger = new Logger(AccountsService.name);

  constructor(
    private readonly redisService: CacheRedisService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getAccount(userId: string) {
    const { success, data, error } =
      await this.redisService.getFromCache<CachedUser>(makeAccountKey(userId));

    if (success && data) return data;

    if (!success) {
      this.logger.error(error);
    }

    const user = (await this.databaseService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        created_at: true,
      },
    })) satisfies CachedUser | null;

    if (!user) {
      throw new NotFoundException(`User ${MESSAGES.NOT_FOUND}`);
    }

    const cached = await this.redisService.setInCache(
      makeAccountKey(userId),
      user,
    );

    if (!cached.success) {
      this.logger.error(cached.error);
    }

    return user;
  }

  async updateAccount(userId: string, body: UpdateAccountDto) {
    const user = (await this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: { name: body.name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        created_at: true,
      },
    })) satisfies CachedUser;

    const cached = await this.redisService.setInCache(
      makeAccountKey(userId),
      user,
    );

    if (!cached.success) {
      this.logger.error(cached.error);
    }

    return { message: 'success' };
  }

  async deleteAccount(userId: string) {
    await this.databaseService.user.delete({
      where: {
        id: userId,
      },
    });

    const cached = await this.redisService.deleteFromCache(
      makeAccountKey(userId),
    );

    if (!cached.success) {
      this.logger.error(cached.error);
    }

    return { message: 'success' };
  }
}
