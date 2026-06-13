import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Notification,
  NotificationDelivery,
  Request,
  RolePermission,
  User,
} from '../database/entities';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsListener } from './notifications.listener';
import { NotificationsService } from './notifications.service';

/**
 * Notifications (CDC §7) : in-app + temps réel (WebSocket) + courriel.
 * Consomme les événements métier via EventEmitter2 (broker in-process).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationDelivery,
      Request,
      User,
      RolePermission,
    ]),
    JwtModule.register({}),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsListener,
  ],
})
export class NotificationsModule {}
