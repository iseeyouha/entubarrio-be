import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
    return { event: 'joined', data: room };
  }

  notifyOrderUpdate(orderId: string, payload: any) {
    this.server.to(`order_${orderId}`).emit('order_updated', payload);
  }

  notifyNewOrder(storeId: string, order: any) {
    this.server.to(`store_${storeId}`).emit('new_order', order);
  }
}
