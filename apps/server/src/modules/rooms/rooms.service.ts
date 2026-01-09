import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { makeRoomCacheKey } from './utils/fns';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { InviteUserDto } from './dtos/invite-user.dto';

import { MESSAGES } from '../../common/constants';

import { RedisService } from '../../core/redis/redis.service';
import { MailerService } from '../../core/mailer/mailer.service';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class RoomsService {
  logger = new Logger(RoomsService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly mailerService: MailerService,
    private readonly databaseService: DatabaseService,
  ) {}

  async createRoom(userId: string, createRoomDto: CreateRoomDto) {
    const room = await this.databaseService.rooms.create({
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
      this.logger.error(error);
    }

    return { id: room.id };
  }

  async updateRoom(roomId: string, dto: UpdateRoomDto) {
    try {
      const room = await this.databaseService.rooms.update({
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
        this.logger.error(error);
      }

      return { message: 'success' };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Room ${MESSAGES.NOT_FOUND}`);
        }
      }

      this.logger.error(error);

      throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteRoom(roomId: string) {
    await this.databaseService.rooms.delete({
      where: {
        id: roomId,
      },
    });

    return { message: 'success' };
  }

  async inviteUser(inviterId: string, roomId: string, dto: InviteUserDto) {
    return await this.databaseService.$transaction(async (tx) => {
      const roomInfo = await tx.invites.create({
        data: {
          role: dto.role,
          room_id: roomId,
          email: dto.email,
          inviter_id: inviterId,
        },
        select: {
          room: {
            select: {
              name: true,
            },
          },
        },
      });

      const { success, error } = await this.mailerService.sendMail({
        receiver: dto.email,
        sender: '', //FIXME: ADD SENDING MAIL
        subject: `You have been Invited to Join ${roomInfo.room.name}`,
        html: '', //FIXME: ADD HTML
      });

      if (!success) {
        this.logger.error(error);

        throw new InternalServerErrorException(MESSAGES.INTERNAL_SERVER_ERROR);
      }

      return { message: 'success' };
    });
  }

  async revokeInvite(roomId: string, inviteId: string) {
    const inviteStatus = await this.databaseService.invites.findUniqueOrThrow({
      where: {
        id: inviteId,
        room_id: roomId,
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

    await this.databaseService.invites.delete({
      where: { id: inviteId, room_id: roomId },
    });

    return { message: 'success' };
  }
}
