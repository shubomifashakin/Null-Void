import { type Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
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
  Get,
  Query,
} from '@nestjs/common';

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { InviteUserDto } from './dtos/invite-user.dto';

import { Roles } from '../../common/decorators/roles.decorators';

import { AuthGuard } from '../../common/guards/auth.guard';
import { RoomRoleGuard } from '../../common/guards/room-role.guard';
import { IsMemberGuard } from '../../common/guards/is-member.guard';
import {
  CreateRoomResponseDto,
  GetInvitesResponseDto,
  GetRoomsResponseDto,
} from './dtos/room-response.dto';

@ApiBearerAuth()
@ApiCookieAuth('access_token')
@UseGuards(AuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({ summary: 'To create a new room' })
  @ApiResponse({
    status: 200,
    description: 'Room created successfully',
    type: CreateRoomResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBody({ type: CreateRoomDto })
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 2.5 } })
  @Post()
  createRoom(@Req() req: Request, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.id, dto);
  }

  @ApiOperation({ summary: 'To get a list of rooms the logged in user is in' })
  @ApiResponse({
    status: 200,
    description: 'Rooms retrieved successfully',
    type: GetRoomsResponseDto,
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @Get()
  getRooms(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ): Promise<GetRoomsResponseDto> {
    return this.roomsService.getRooms(req.user.id, cursor);
  }

  @ApiOperation({ summary: 'To update a room' })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Roles('ADMIN')
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiBody({ type: UpdateRoomDto })
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @HttpCode(200)
  @Patch(':roomId')
  updateRoom(@Param('roomId') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, dto);
  }

  @ApiOperation({ summary: 'To delete a room' })
  @ApiResponse({ status: 200, description: 'Room deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Roles('ADMIN')
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @Throttle({ default: { limit: 3, ttl: 2.5 } })
  @HttpCode(200)
  @Delete(':roomId')
  deleteRoom(@Param('roomId') id: string) {
    return this.roomsService.deleteRoom(id);
  }

  @ApiOperation({ summary: 'To get a list of invites in the room' })
  @ApiResponse({
    status: 200,
    description: 'Invites retrieved successfully',
    type: GetInvitesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @UseGuards(IsMemberGuard)
  @HttpCode(200)
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Pagination cursor',
  })
  @Get(':roomId/invites')
  getInvites(
    @Param('roomId') id: string,
    @Query('cursor') cursor?: string,
  ): Promise<GetInvitesResponseDto> {
    return this.roomsService.getInvites(id, cursor);
  }

  @ApiOperation({ summary: 'To invite a user to the room' })
  @ApiResponse({ status: 200, description: 'User invited successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Roles('ADMIN')
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiBody({ type: InviteUserDto })
  @Throttle({ default: { limit: 3, ttl: 2.5 } })
  @HttpCode(200)
  @Post(':roomId/invites')
  inviteUser(
    @Req() req: Request,
    @Param('roomId') id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.roomsService.inviteUser(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'To delete an invite that has been sent out but not responded to',
  })
  @ApiResponse({
    status: 404,
    description: 'Invite not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({ status: 200, description: 'Invite revoked successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Roles('ADMIN')
  @UseGuards(IsMemberGuard, RoomRoleGuard)
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiParam({ name: 'inviteId', description: 'Invite ID' })
  @Throttle({ default: { limit: 3, ttl: 2.5 } })
  @HttpCode(200)
  @Delete(':roomId/invites/:inviteId')
  revokeInvite(
    @Param('roomId') roomId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.roomsService.revokeInvite(roomId, inviteId);
  }
}
