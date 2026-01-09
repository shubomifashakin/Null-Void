import { type Request } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  Param,
  Patch,
  Delete,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { InviteUserDto } from './dtos/invite-user.dto';

import { Roles } from '../../common/decorators/roles.decorators';

import { AuthGuard } from '../../common/guards/auth.guard';
import { RoomRoleGuard } from '../../common/guards/room-role.guard';
import { IsMemberGuard } from '../../common/guards/is-member.guard';

@UseGuards(AuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @HttpCode(200)
  @Post()
  createRoom(@Req() req: Request, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.id, dto);
  }

  @Roles('ADMIN')
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @HttpCode(200)
  @Patch(':roomId')
  updateRoom(@Param('roomId') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, dto);
  }

  @Roles('ADMIN')
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @HttpCode(200)
  @Delete(':roomId')
  deleteRoom(@Param('roomId') id: string) {
    return this.roomsService.deleteRoom(id);
  }

  @Roles('ADMIN')
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @HttpCode(200)
  @Post(':roomId/invites')
  inviteUser(
    @Req() req: Request,
    @Param('roomId') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.roomsService.inviteUser(req.user.id, id, dto);
  }

  @Roles('ADMIN')
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @HttpCode(200)
  @Delete(':roomId/invites/:inviteId')
  revokeInvite(
    @Param('roomId') roomId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.roomsService.revokeInvite(roomId, inviteId);
  }
}
