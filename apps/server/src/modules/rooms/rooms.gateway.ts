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

@WebSocketGateway({
  namespace: 'rooms',
  pingTimeout: 15000,
  pingInterval: 30000,
  cors: {
    origin: '*',
  },
  perMessageDeflate: true,
  connectTimeout: 10000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 5e8,
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

  @SubscribeMessage(WS_EVENTS.USER_LEFT)
  handleLeaveEvent(): void {
    //FIXME: REMOVE CLIENT from room tracking
  }

  @SubscribeMessage(WS_EVENTS.USER_REMOVE)
  handleRemoveEvent(): void {
    // FIXME: IMPLEMENT
    //FIXME: REMOVE CLIENT from room tracking
  }

  @SubscribeMessage(WS_EVENTS.USER_MOVE)
  handleMouseMoveEvent() {}

  async handleConnection(client: Socket) {
    return this.roomsEventsService.handleConnection(client);
  }

  handleDisconnect(client: Socket): void {
    console.log('Client disconnected:', client.id);

    //FIXME: REMOVE CLIENT from room tracking

    //FIXME: Broadcast that user left the room
    this.server.emit(WS_EVENTS.USER_LEFT, { userId: client.id });
  }
}
