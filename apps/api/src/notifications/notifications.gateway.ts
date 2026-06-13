import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

/** Préfixe des rooms par utilisateur. */
const userRoom = (userId: string): string => `user:${userId}`;

/**
 * Passerelle WebSocket des notifications temps réel (CDC §7 WEB_PUSH_REALTIME,
 * [EXG-07-103]). Authentifie le handshake par JWT (query `token` ou header
 * Authorization) puis place le client dans une room dédiée à son utilisateur.
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      void client.join(userRoom(payload.sub));
    } catch {
      // Jeton invalide / expiré : on ferme la connexion.
      client.disconnect(true);
    }
  }

  /** Diffuse une notification temps réel à un utilisateur connecté. */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.server?.to(userRoom(userId)).emit(event, data);
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token) return auth.token;
    const q = client.handshake.query?.token;
    if (typeof q === 'string') return q;
    const header = client.handshake.headers?.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return null;
  }
}
