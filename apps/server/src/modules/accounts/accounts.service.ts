import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { UpdateAccountDto } from './dtos/update-account.dto';

import { RedisService } from '../../core/redis/redis.service';
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
    private readonly redisService: RedisService,
    private readonly databaseService: DatabaseService,
  ) {}

  private handleDatabaseError(error: any): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(`User ${MESSAGES.NOT_FOUND}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
  }

  async getAccount(userId: string) {
    const { success, data, error } =
      await this.redisService.getFromCache<CachedUser>(makeAccountKey(userId));

    if (success && data) return data;

    if (!success) {
      this.logger.error(error);
    }

    const user = (await this.databaseService.users.findUnique({
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
    try {
      const user = (await this.databaseService.users.update({
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

      return user;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteAccount(userId: string) {
    try {
      (await this.databaseService.users.delete({
        where: {
          id: userId,
        },
      })) satisfies CachedUser;

      const cached = await this.redisService.deleteFromCache(
        makeAccountKey(userId),
      );

      if (!cached.success) {
        this.logger.error(cached.error);
      }

      return { message: 'success' };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
