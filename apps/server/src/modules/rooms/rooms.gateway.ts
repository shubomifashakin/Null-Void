import {
  ParseBoolPipe,
  ParseFloatPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { WS_EVENTS } from './utils/constants';
import { RoomsGatewayService } from './rooms-gateway.service';

import { Roles } from '../../common/decorators/roles.decorators';
import { RoomRoleGuard } from '../../common/guards/room-role.guard';
import {
  CircleEventDto,
  LineEventDto,
  PolygonEventDto,
} from './dtos/draw-event.dto';
import { DrawEventValidationPipe } from './pipes/draw-event-validation.pipe';
import { UpdateRoomDto } from './dtos/update-room.dto';

@WebSocketGateway({
  namespace: 'rooms',
  pingTimeout: 15000,
  pingInterval: 30000,
  perMessageDeflate: true,
  connectTimeout: 10000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6,
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly roomsGatewayService: RoomsGatewayService) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage(WS_EVENTS.USER_DRAW)
  handleDrawEvent(
    @MessageBody(DrawEventValidationPipe)
    data: LineEventDto | PolygonEventDto | CircleEventDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.roomsGatewayService.handleDraw(client, data);
  }

  @SubscribeMessage(WS_EVENTS.ROOM_LEAVE)
  handleLeaveEvent(client: Socket) {
    return this.roomsGatewayService.handleLeave(client);
  }

  @UseGuards(RoomRoleGuard)
  @Roles('ADMIN')
  @SubscribeMessage(WS_EVENTS.USER_REMOVE)
  handleRemoveEvent(
    @MessageBody('userId', new ParseUUIDPipe({ version: '4' })) data: string,
    @ConnectedSocket() client: Socket,
  ) {
    return this.roomsGatewayService.handleRemove(this.server, client, data);
  }

  @SubscribeMessage(WS_EVENTS.USER_MOVE)
  handleMouseMoveEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody('x', ParseFloatPipe) x: number,
    @MessageBody('y', ParseFloatPipe) y: number,
    @MessageBody('timestamp', ParseIntPipe) timestamp: number,
    @MessageBody('isPenDown', ParseBoolPipe) isPenDown: boolean,
  ) {
    return this.roomsGatewayService.handleUserMove(client, {
      x,
      y,
      timestamp: String(timestamp),
      isPenDown,
    });
  }

  @UseGuards(RoomRoleGuard)
  @Roles('ADMIN')
  @SubscribeMessage(WS_EVENTS.ROOM_INFO)
  handleUpdateRoomInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateRoomDto,
  ) {
    return this.roomsGatewayService.updateRoomInfo(this.server, client, dto);
  }

  handleConnection(client: Socket) {
    return this.roomsGatewayService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    return this.roomsGatewayService.handleDisconnect(client);
  }
}
