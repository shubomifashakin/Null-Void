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

@WebSocketGateway({
  namespace: 'rooms',
  pingTimeout: 15000,
  pingInterval: 15000,
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  //FIXME: IMPORT REDIS SERVICE
  constructor() {}
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
  }
}
