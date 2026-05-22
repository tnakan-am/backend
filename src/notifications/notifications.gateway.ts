import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Notification } from './entities/notification.entity';
import { OrderStatus } from '../orders/entities/order.entity';

const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: corsOrigin, credentials: true },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      this.fromAuthHeader(client.handshake.headers.authorization);
    if (!token) {
      this.logger.warn('WS connect rejected — no token');
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtConstants.secret,
      });
      (client.data as { user?: JwtPayload }).user = payload;
      await client.join(`user:${payload.sub}`);
      this.logger.log(`WS connected: user ${payload.sub} (${client.id})`);
    } catch {
      this.logger.warn('WS connect rejected — invalid token');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = (client.data as { user?: JwtPayload }).user;
    if (user) this.logger.log(`WS disconnected: user ${user.sub}`);
  }

  emitNew(notification: Notification): void {
    this.server
      .to(`user:${notification.userId}`)
      .emit('notification:new', notification);
  }

  emitStatus(
    userId: string,
    payload: { id: string; orderId: string; status: OrderStatus },
  ): void {
    this.server.to(`user:${userId}`).emit('notification:status', payload);
  }

  private fromAuthHeader(authorization?: string): string | undefined {
    if (!authorization) return undefined;
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
