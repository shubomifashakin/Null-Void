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

  @SubscribeMessage('draw')
  handleDrawEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Client:', client.id, 'sent data:', data);

    //send to eevryone connected on this server
    client.broadcast.emit('draw', data);

    //FIXME: Publish to Redis for other servers

    //FIXME: ADD TO QUEUE so it can be saved to database
  }

  @SubscribeMessage('leave')
  handleLeaveEvent(): void {
    //FIXME: REMOVE CLIENT from room tracking
  }

  @SubscribeMessage('remove')
  handleRemoveEvent(): void {
    // FIXME: IMPLEMENT
    //FIXME: REMOVE CLIENT from room tracking
  }

  @SubscribeMessage('mousemove')
  handleMouseMoveEvent() {}

  handleConnection(client: Socket): void {
    console.log('Client connected:', client.id);
    console.log('Client data:', client.data);

    // FIXME: Add client to room tracking

    //FIXME: Broadcast that a new user joined the room
    this.server.emit('user_joined', { userId: client.id });
  }

  handleDisconnect(client: Socket): void {
    console.log('Client disconnected:', client.id);

    //FIXME: REMOVE CLIENT from room tracking

    //FIXME: Broadcast that user left the room
    this.server.emit('user_left', { userId: client.id });
  }
}
