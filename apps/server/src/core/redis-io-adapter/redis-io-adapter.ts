import { IoAdapter } from '@nestjs/platform-socket.io';
import { type INestApplicationContext } from '@nestjs/common';

import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import { RedisService } from '../redis/redis.service';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    private readonly redisService: RedisService,
    appOrHttpServer: INestApplicationContext,
  ) {
    super(appOrHttpServer);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = this.redisService.getClient();
    const subClient = pubClient.duplicate();

    await subClient.connect();

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }
}
