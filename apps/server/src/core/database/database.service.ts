import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../generated/prisma/client';
import { AppConfigService } from '../app-config/app-config.service';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy {
  constructor(private readonly appConfigService: AppConfigService) {
    const { success, data, error } = appConfigService.DATABASE_URL;

    if (!success) {
      throw new Error(error);
    }
    super({
      adapter: new PrismaPg({
        connectionString: data,
      }),
      transactionOptions: {
        maxWait: 5000,
        timeout: 10000,
      },
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
