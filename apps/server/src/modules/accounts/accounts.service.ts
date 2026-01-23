import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UpdateAccountDto } from './dtos/update-account.dto';

import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';
import { DatabaseService } from '../../core/database/database.service';

import { MESSAGES } from '../../common/constants';
import { makeAccountKey } from '../../common/utils';
import { InviteStatus } from 'generated/prisma/enums';

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

  async getInvites(userId: string, cursor?: string) {
    const limit = 10;

    const usersEmail = await this.databaseService.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        email: true,
      },
    });

    const invites = await this.databaseService.invite.findMany({
      where: {
        email: usersEmail.email,
        status: 'PENDING',
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        role: true,
        status: true,
        created_at: true,
        expires_at: true,
        room: { select: { name: true } },
        inviter: { select: { name: true, picture: true } },
      },
    });

    const data = invites.slice(0, limit);

    const hasNextPage = invites.length > limit;
    const next = data.length > 0 ? invites[invites.length - 1].id : null;

    const transformed = data.map((data) => {
      return {
        id: data.id,
        role: data.role,
        status: data.status,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        roomName: data.room.name,
        invitersName: data.inviter.name,
        invitersPicture: data.inviter.picture,
      };
    });

    return {
      data: transformed,
      cursor: hasNextPage ? next : null,
      hasNextPage,
    };
  }

  async updateInvite(inviteId: string, status: InviteStatus) {
    const inviteStatus = await this.databaseService.invite.findUniqueOrThrow({
      where: {
        id: inviteId,
      },
      select: {
        status: true,
      },
    });

    if (inviteStatus.status !== 'PENDING') {
      throw new BadRequestException(
        `Invite has already been ${inviteStatus.status.toLowerCase()}`,
      );
    }

    await this.databaseService.invite.update({
      where: { id: inviteId },
      data: { status },
    });

    return { message: 'success' };
  }
}
