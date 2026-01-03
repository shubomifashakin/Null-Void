import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../../core/redis/redis.service';

@Injectable()
export class AccountsService {
  logger = new Logger(AccountsService.name);

  constructor(private readonly redisService: RedisService) {}

  getAccount(userId: string) {
    console.log(userId);
    return { id: userId };
  }

  updateAccount(userId: string) {
    console.log(userId);
    return userId;
  }

  deleteAccount(userId: string) {
    console.log(userId);
    return userId;
  }
}
