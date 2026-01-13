import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
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
import { RoomsEventsService } from './rooms-events.service';

import { Roles } from '../../common/decorators/roles.decorators';
import { RoomRoleGuard } from '../../common/guards/room-role.guard';

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
  constructor(private readonly roomsEventsService: RoomsEventsService) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage(WS_EVENTS.USER_DRAW)
  handleDrawEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Client:', client.id, 'sent data:', data);

    //send to eevryone connected on this server
    client.broadcast.emit(WS_EVENTS.USER_DRAW, data);

    //FIXME: Publish to Redis for other servers

    //FIXME: ADD TO QUEUE so it can be saved to database
  }

  @SubscribeMessage(WS_EVENTS.ROOM_LEAVE)
  handleLeaveEvent(client: Socket) {
    return this.roomsEventsService.handleLeave(client);
  }

  @UseGuards(RoomRoleGuard)
  @Roles('ADMIN')
  @SubscribeMessage(WS_EVENTS.USER_REMOVE)
  handleRemoveEvent(
    @MessageBody('userId', new ParseUUIDPipe({ version: '4' })) data: string,
    @ConnectedSocket() client: Socket,
  ) {
    return this.roomsEventsService.handleRemove(this.server, client, data);
  }

  @SubscribeMessage(WS_EVENTS.USER_MOVE)
  handleMouseMoveEvent() {}

  handleConnection(client: Socket) {
    return this.roomsEventsService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    return this.roomsEventsService.handleDisconnect(client);
  }
}
