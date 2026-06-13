import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {
  Notification,
  NotificationDelivery,
  type NotificationPayload,
  Request,
  RolePermission,
  User,
} from '../database/entities';
import { MailService } from '../mail/mail.service';
import { formatLocalDateTime, statusLabel } from '../requests/request-labels';
import { NotificationsGateway } from './notifications.gateway';
import {
  GESTIONNAIRE_PERMISSION,
  NOTIFICATION_EVENTS,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationEventCode,
  type NotificationEventDef,
  type RecipientTarget,
} from './notification-events';
import type { TemplateCode } from '../mail/templates';

export interface DispatchContext {
  requestId?: string | null;
  /** Acteur de l'action — exclu des destinataires (pas d'auto-notification). */
  actorUserId?: string | null;
  /** Résumé court de l'action (affiché in-app et en courriel). */
  actionSummary?: string;
}

interface ResolvedRecipient {
  user: User;
  portal: 'client' | 'admin';
  email: boolean;
  emailTemplate?: TemplateCode;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveries: Repository<NotificationDelivery>,
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Dispatch d'un événement métier vers ses destinataires (CDC §7). Best-effort
   * et non bloquant : toute erreur est journalisée sans interrompre le flux.
   */
  async dispatch(
    eventCode: NotificationEventCode,
    ctx: DispatchContext = {},
  ): Promise<void> {
    const def: NotificationEventDef = NOTIFICATION_EVENTS[eventCode];
    const request = ctx.requestId
      ? await this.requests.findOne({ where: { id: ctx.requestId } })
      : null;

    const recipients = await this.resolveRecipients(
      def.recipients,
      request,
      ctx,
    );
    for (const recipient of recipients) {
      try {
        await this.deliverTo(
          eventCode,
          def.category,
          def.critical ?? false,
          recipient,
          request,
          ctx,
          recipient.emailTemplate ?? def.emailTemplate,
        );
      } catch (error) {
        this.logger.warn(
          `Notification ${eventCode} → ${recipient.user.id} échouée : ${(error as Error).message}`,
        );
      }
    }
  }

  private async deliverTo(
    eventCode: NotificationEventCode,
    category: NotificationCategory,
    critical: boolean,
    recipient: ResolvedRecipient,
    request: Request | null,
    ctx: DispatchContext,
    emailTemplate: TemplateCode | undefined,
  ): Promise<void> {
    const def = NOTIFICATION_EVENTS[eventCode];
    const ref = request?.publicReference ?? null;
    const url = ref ? `/${recipient.portal}/requests/${ref}` : null;
    const payload: NotificationPayload = {
      title: def.inAppLabel,
      body: ctx.actionSummary || request?.title || def.inAppLabel,
      url,
      publicReference: ref ?? undefined,
    };

    // Canal IN_APP (+ temps réel) si activé par les préférences ou critique.
    if (critical || this.channelEnabled(recipient.user, category, 'IN_APP')) {
      const notif = await this.notifications.save(
        this.notifications.create({
          eventCode,
          requestId: request?.id ?? null,
          recipientUserId: recipient.user.id,
          payload,
          isCritical: critical,
        }),
      );
      await this.deliveries.save(
        this.deliveries.create({
          notificationId: notif.id,
          channel: 'IN_APP',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
        }),
      );
      // Push temps réel (best-effort).
      try {
        this.gateway.emitToUser(recipient.user.id, 'notification', {
          id: notif.id,
          ...payload,
          createdAt: notif.createdAt,
        });
        await this.deliveries.save(
          this.deliveries.create({
            notificationId: notif.id,
            channel: 'WEB_PUSH_REALTIME',
            status: 'SENT',
            attempts: 1,
            lastAttemptAt: new Date(),
          }),
        );
      } catch {
        /* le destinataire n'est peut-être pas connecté : sans gravité */
      }

      // Canal EMAIL.
      if (
        recipient.email &&
        emailTemplate &&
        recipient.user.emailStatus !== 'INVALID' &&
        (critical || this.channelEnabled(recipient.user, category, 'EMAIL'))
      ) {
        await this.sendEmail(notif.id, recipient, request, ctx, emailTemplate);
      }
    }
  }

  private async sendEmail(
    notificationId: string,
    recipient: ResolvedRecipient,
    request: Request | null,
    ctx: DispatchContext,
    template: TemplateCode,
  ): Promise<void> {
    const base = this.config
      .get<string>('APP_WEB_BASE_URL', 'http://localhost:3001')
      .replace(/\/$/, '');
    const ref = request?.publicReference ?? '';
    const variables: Record<string, string> = {
      first_name: recipient.user.firstName,
      public_reference: ref,
      title: request?.title ?? '',
      status_label: request ? statusLabel(request.status) : '',
      request_url: ref ? `${base}/${recipient.portal}/requests/${ref}` : base,
      action_summary: ctx.actionSummary ?? '',
      created_at_local: request
        ? formatLocalDateTime(request.createdAt, recipient.user.timeZone)
        : '',
    };
    try {
      await this.mail.send({ to: recipient.user.email, template, variables });
      await this.deliveries.save(
        this.deliveries.create({
          notificationId,
          channel: 'EMAIL',
          status: 'SENT',
          attempts: 1,
          lastAttemptAt: new Date(),
        }),
      );
    } catch (error) {
      await this.deliveries.save(
        this.deliveries.create({
          notificationId,
          channel: 'EMAIL',
          status: 'FAILED',
          attempts: 1,
          lastAttemptAt: new Date(),
          errorMessage: (error as Error).message.slice(0, 500),
        }),
      );
    }
  }

  private async resolveRecipients(
    rules: ReadonlyArray<{
      target: RecipientTarget;
      email: boolean;
      emailTemplate?: TemplateCode;
    }>,
    request: Request | null,
    ctx: DispatchContext,
  ): Promise<ResolvedRecipient[]> {
    // userId → { email (OU logique), portal, template }
    const acc = new Map<string, ResolvedRecipient>();

    const add = async (
      userId: string | null,
      portal: 'client' | 'admin',
      email: boolean,
      emailTemplate: TemplateCode | undefined,
    ) => {
      if (!userId || userId === ctx.actorUserId) return; // pas d'auto-notification
      const existing = acc.get(userId);
      if (existing) {
        existing.email = existing.email || email;
        existing.emailTemplate = existing.emailTemplate ?? emailTemplate;
        return;
      }
      const user = await this.users.findOne({
        where: { id: userId, isActive: true, deletedAt: IsNull() },
      });
      if (user) acc.set(userId, { user, portal, email, emailTemplate });
    };

    for (const rule of rules) {
      if (rule.target === 'AUTHOR') {
        await add(
          request?.createdByUserId ?? null,
          'client',
          rule.email,
          rule.emailTemplate,
        );
      } else if (rule.target === 'ASSIGNEE') {
        await add(
          request?.assignedToUserId ?? null,
          'admin',
          rule.email,
          rule.emailTemplate,
        );
      } else if (rule.target === 'GESTIONNAIRES') {
        for (const id of await this.gestionnaireIds()) {
          await add(id, 'admin', rule.email, rule.emailTemplate);
        }
      }
    }
    return [...acc.values()];
  }

  private async gestionnaireIds(): Promise<string[]> {
    const rows = await this.rolePermissions.find({
      where: { permissionCode: GESTIONNAIRE_PERMISSION },
    });
    const roleIds = rows.map((r) => r.roleId);
    if (roleIds.length === 0) return [];
    const users = await this.users.find({
      where: { roleId: In(roleIds), isActive: true, deletedAt: IsNull() },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  /** Préférence par catégorie × canal (défaut activé ; voir CDC §7.6). */
  private channelEnabled(
    user: User,
    category: NotificationCategory,
    channel: NotificationChannel,
  ): boolean {
    const prefs = user.notificationPreferences as
      | Record<string, Record<string, boolean>>
      | null
      | undefined;
    const value = prefs?.[category]?.[channel];
    return value !== false; // activé par défaut
  }

  // -------------------- Requêtes (page notifications / badge) --------------------

  async listForUser(
    userId: string,
    opts: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<Notification[]> {
    return this.notifications.find({
      where: {
        recipientUserId: userId,
        ...(opts.unreadOnly ? { isReadInApp: false } : {}),
      },
      order: { createdAt: 'DESC' },
      take: Math.min(opts.limit ?? 50, 100),
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifications.count({
      where: { recipientUserId: userId, isReadInApp: false },
    });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.notifications.update(
      { id, recipientUserId: userId },
      { isReadInApp: true, readAt: new Date() },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.update(
      { recipientUserId: userId, isReadInApp: false },
      { isReadInApp: true, readAt: new Date() },
    );
  }

  async getPreferences(userId: string): Promise<Record<string, unknown>> {
    const user = await this.users.findOne({ where: { id: userId } });
    return (user?.notificationPreferences as Record<string, unknown>) ?? {};
  }

  async updatePreferences(
    userId: string,
    prefs: Record<string, Record<string, boolean>>,
  ): Promise<Record<string, unknown>> {
    await this.users.update({ id: userId }, { notificationPreferences: prefs });
    return prefs;
  }
}
