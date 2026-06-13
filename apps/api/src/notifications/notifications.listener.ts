import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NOTIFY_EVENT, type NotifyEventPayload } from './notification-events';
import { NotificationsService } from './notifications.service';

/**
 * Consommateur des événements métier (broker in-process EventEmitter2). Découple
 * l'émission (services métier) de la livraison des notifications [EXG-07-004].
 * En production, ce broker peut être remplacé par Redis Streams sans toucher
 * aux émetteurs.
 */
@Injectable()
export class NotificationsListener {
  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent(NOTIFY_EVENT, { async: true })
  async handle(payload: NotifyEventPayload): Promise<void> {
    await this.notifications.dispatch(payload.eventCode, {
      requestId: payload.requestId,
      actorUserId: payload.actorUserId,
      actionSummary: payload.actionSummary,
    });
  }
}
