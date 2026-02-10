import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { generateInviteMail, makeRoomCacheKey } from './utils/fns';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { InviteUserDto } from './dtos/invite-user.dto';

import { DAYS_7_MS, MESSAGES } from '../../common/constants';

import { CacheRedisService } from '../../core/cache-redis/cache-redis.service';
import { MailerService } from '../../core/mailer/mailer.service';
import { DatabaseService } from '../../core/database/database.service';
import { AppConfigService } from '../../core/app-config/app-config.service';

@Injectable()
export class RoomsService {
  logger = new Logger(RoomsService.name);

  constructor(
    private readonly redisService: CacheRedisService,
    private readonly mailerService: MailerService,
    private readonly databaseService: DatabaseService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async createRoom(userId: string, createRoomDto: CreateRoomDto) {
    const room = await this.databaseService.room.create({
      data: {
        owner_id: userId,
        name: createRoomDto.name,
        description: createRoomDto.description,
        members: {
          create: {
            role: 'ADMIN',
            user_id: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    const { success, error } = await this.redisService.setInCache(
      makeRoomCacheKey(room.id),
      room,
    );

    if (!success) {
      this.logger.error({
        message: 'Failed to cache room',
        error,
      });
    }

    return { id: room.id };
  }

  async getRooms(userId: string, cursor?: string) {
    const limit = 10;

    const rooms = await this.databaseService.roomMember.findMany({
      where: {
        user_id: userId,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        role: true,
        created_at: true,
        room: {
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
          },
        },
      },
    });

    const data = rooms.slice(0, limit);

    const hasNextPage = rooms.length > limit;
    const next = data.length > 0 ? rooms[rooms.length - 1].id : null;

    const transformed = data.map((data) => {
      return {
        role: data.role,
        id: data.room.id,
        name: data.room.name,
        joinedAt: data.created_at,
        createdAt: data.room.created_at,
        description: data.room.description,
      };
    });

    return {
      data: transformed,
      cursor: hasNextPage ? next : null,
      hasNextPage,
    };
  }

  async updateRoom(roomId: string, dto: UpdateRoomDto) {
    const room = await this.databaseService.room.update({
      where: {
        id: roomId,
      },
      data: {
        name: dto?.name,
        description: dto?.description,
      },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        description: true,
      },
    });

    const { success, error } = await this.redisService.setInCache(
      makeRoomCacheKey(room.id),
      room,
    );

    if (!success) {
      this.logger.error({
        message: 'Failed to cache room',
        error,
      });
    }

    return { message: 'success' };
  }

  async deleteRoom(roomId: string) {
    await this.databaseService.room.delete({
      where: {
        id: roomId,
      },
    });

    const { success, error } = await this.redisService.deleteFromCache(
      makeRoomCacheKey(roomId),
    );

    if (!success) {
      this.logger.error({
        message: 'Failed to delete room from cache',
        error,
      });
    }

    return { message: 'success' };
  }

  async inviteUser(inviterId: string, roomId: string, dto: InviteUserDto) {
    return await this.databaseService.$transaction(
      async (tx) => {
        const invitersInfo = await tx.user.findUniqueOrThrow({
          where: {
            id: inviterId,
          },
          select: {
            name: true,
            email: true,
          },
        });

        //prevent from inviting self
        if (invitersInfo.email === dto.email) {
          throw new BadRequestException('You cannot invite yourself');
        }

        const inviteInfo = await tx.invite.create({
          data: {
            role: dto.role,
            room_id: roomId,
            email: dto.email,
            inviter_id: inviterId,
            expires_at: new Date(Date.now() + DAYS_7_MS),
          },
          select: {
            room: {
              select: {
                name: true,
              },
            },
            id: true,
            expires_at: true,
          },
        });

        const { success, error } = await this.mailerService.sendMail({
          receiver: dto.email,
          sender: `Null Void <${this.appConfigService.MAILER_FROM.data!}>`,
          subject: `You have been invited to join ${inviteInfo.room.name}`,
          html: generateInviteMail({
            inviterName: invitersInfo.name,
            roomName: inviteInfo.room.name,
            inviteLink: `${this.appConfigService.FRONTEND_URL.data!}/dashboard?tab=invites`,
            expiryDate: inviteInfo.expires_at,
          }),
        });

        if (!success) {
          this.logger.error({
            message: 'Failed to send invite email',
            error,
          });

          throw new InternalServerErrorException(
            MESSAGES.INTERNAL_SERVER_ERROR,
          );
        }

        return { message: 'success' };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }

  async getInvites(roomId: string, cursor?: string) {
    const limit = 10;

    const invites = await this.databaseService.invite.findMany({
      where: {
        room_id: roomId,
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
        created_at: true,
        email: true,
        status: true,
        expires_at: true,
        inviter_id: true,
        inviter: { select: { name: true } },
      },
    });

    const data = invites.slice(0, limit);

    const hasNextPage = invites.length > limit;
    const next = data.length > 0 ? invites[invites.length - 1].id : null;

    const transformed = data.map((data) => {
      return {
        id: data.id,
        role: data.role,
        email: data.email,
        status: data.status,
        expiresAt: data.expires_at,
        invitersName: data.inviter.name,
        invitersId: data.inviter_id,
        createdAt: data.created_at,
      };
    });

    return {
      data: transformed,
      cursor: hasNextPage ? next : null,
      hasNextPage,
    };
  }

  async revokeInvite(roomId: string, inviteId: string) {
    const inviteStatus = await this.databaseService.invite.findUniqueOrThrow({
      where: {
        id: inviteId,
        room_id: roomId,
      },
      select: {
        status: true,
      },
    });

    //prevent from deleting an invite that has been replied by the invitee
    if (inviteStatus.status !== 'PENDING') {
      throw new BadRequestException(
        `Invite has already been ${inviteStatus.status.toLowerCase()}`,
      );
    }

    await this.databaseService.invite.delete({
      where: { id: inviteId, room_id: roomId },
    });

    return { message: 'success' };
  }
}
