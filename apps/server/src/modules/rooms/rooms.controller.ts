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

import { AuthGuard } from '../../common/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @HttpCode(200)
  @Post()
  createRoom(@Req() req: Request, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.id, dto);
  }

  //FIXME: NEEDS AN IS MEMBER GUARD or IS ADMIN GUARD
  @HttpCode(200)
  @Patch(':id')
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, dto);
  }

  //FIXME: NEEDS AN IS MEMBER GUARD or IS ADMIN GUARD
  @HttpCode(200)
  @Delete(':id')
  deleteRoom(@Param('id') id: string) {
    return this.roomsService.deleteRoom(id);
  }

  //FIXME: NEEDS AN IS MEMBER GUARD or IS ADMIN GUARD
  @HttpCode(200)
  @Post(':id/invites')
  inviteUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.roomsService.inviteUser(req.user.id, id, dto);
  }

  //FIXME: NEEDS AN IS MEMBER GUARD or IS ADMIN GUARD
  @HttpCode(200)
  @Delete(':id/invites/:inviteId')
  revokeInvite(
    @Param('id') roomId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.roomsService.revokeInvite(roomId, inviteId);
  }
}
