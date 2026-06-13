import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Request, RequestMessage } from '../database/entities';
import { NOTIFY_EVENT } from '../notifications/notification-events';
import type { CreateMessageDto, WithdrawMessageDto } from './dto/message.dto';
import {
  TransitionsService,
  type TransitionViewer,
} from './transitions.service';

const WITHDRAWN_PLACEHOLDER = '[Message retiré par son auteur]';

export interface MessageView {
  id: string;
  body: string;
  isInternal: boolean;
  isWithdrawn: boolean;
  withdrawalReason: string | null;
  createdAt: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    roleId: string;
  } | null;
}

/**
 * Messagerie des demandes (CDC §3.7). Messages immuables (retrait uniquement),
 * messages internes filtrés pour le Client. Un message du Client sur une
 * demande en attente déclenche la reprise CLIENT_REPLY (CDC §4.4 [EXG-04-010]).
 */
@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    @InjectRepository(RequestMessage)
    private readonly messages: Repository<RequestMessage>,
    private readonly transitions: TransitionsService,
    private readonly events: EventEmitter2,
  ) {}

  async list(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<MessageView[]> {
    const req = await this.loadReadable(viewer, requestId);
    const rows = await this.messages.find({
      where: { requestId: req.id },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
    const isClient = viewer.scope === 'CLIENT';
    return rows
      .filter((m) => !(isClient && m.isInternal)) // le Client ne voit pas l'interne
      .map((m) => this.toView(m));
  }

  async create(
    viewer: TransitionViewer,
    requestId: string,
    dto: CreateMessageDto,
  ): Promise<MessageView> {
    const req = await this.loadReadable(viewer, requestId);
    const isInternalUser = viewer.scope === 'INTERNAL';
    const wantsInternal = dto.isInternal ?? false;

    if (wantsInternal && !isInternalUser) {
      throw new ForbiddenException({
        code: 'CLIENT_CANNOT_POST_INTERNAL',
        message: 'Un Client ne peut pas publier de message interne.',
      });
    }
    if (isInternalUser && !viewer.permissions.includes('requests.message')) {
      throw new ForbiddenException({
        code: 'MESSAGE_NOT_ALLOWED',
        message: "Vous n'avez pas la permission d'échanger des messages.",
      });
    }
    if (!isInternalUser && req.createdByUserId !== viewer.id) {
      // Anti-énumération côté Client : on masque l'existence.
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }

    const saved = await this.messages.save(
      this.messages.create({
        requestId: req.id,
        authorUserId: viewer.id,
        body: dto.body.trim(),
        isInternal: wantsInternal,
      }),
    );

    // Reprise après attente client : un message public du Client propriétaire
    // sur une demande EN_ATTENTE_CLIENT déclenche CLIENT_REPLY (T13/T14/T15).
    if (
      !isInternalUser &&
      !wantsInternal &&
      req.status === 'EN_ATTENTE_CLIENT' &&
      req.createdByUserId === viewer.id
    ) {
      try {
        await this.transitions.apply(viewer, req.id, 'CLIENT_REPLY', {
          expectedStatus: 'EN_ATTENTE_CLIENT',
          note: dto.body.trim().slice(0, 2000),
        });
      } catch (error) {
        this.logger.warn(
          `Reprise CLIENT_REPLY non appliquée pour ${req.id}: ${(error as Error).message}`,
        );
      }
    }

    // Notifications de messagerie (CDC §7). La reprise CLIENT_REPLY est notifiée
    // par le moteur de transitions ; ici on couvre les messages internes et les
    // messages publics adressés au Client par un interne.
    if (wantsInternal) {
      this.events.emit(NOTIFY_EVENT, {
        eventCode: 'NOUVEAU_MESSAGE_INTERNE',
        requestId: req.id,
        actorUserId: viewer.id,
        actionSummary: dto.body.trim().slice(0, 280),
      });
    } else if (isInternalUser) {
      this.events.emit(NOTIFY_EVENT, {
        eventCode: 'NOUVEAU_MESSAGE_CLIENT',
        requestId: req.id,
        actorUserId: viewer.id,
        actionSummary: dto.body.trim().slice(0, 280),
      });
    }

    const full = await this.messages.findOne({
      where: { id: saved.id },
      relations: { author: true },
    });
    return this.toView(full ?? saved);
  }

  async withdraw(
    viewer: TransitionViewer,
    messageId: string,
    dto: WithdrawMessageDto,
  ): Promise<MessageView> {
    const message = await this.messages.findOne({
      where: { id: messageId },
      relations: { author: true, request: true },
    });
    if (!message) throw new NotFoundException({ code: 'MESSAGE_NOT_FOUND' });
    if (message.authorUserId !== viewer.id) {
      throw new ForbiddenException({
        code: 'NOT_MESSAGE_AUTHOR',
        message: 'Seul l’auteur peut retirer son message.',
      });
    }
    if (!message.isWithdrawn) {
      message.isWithdrawn = true;
      message.withdrawnAt = new Date();
      message.withdrawalReason = dto.reason.trim();
      await this.messages.save(message);
    }
    return this.toView(message);
  }

  // -------------------- Helpers --------------------

  private async loadReadable(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<Request> {
    const req = await this.requests.findOne({
      where: { id: requestId, deletedAt: IsNull() },
    });
    if (!req) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    if (
      viewer.scope === 'CLIENT' &&
      req.organizationId !== viewer.organizationId
    ) {
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }
    return req;
  }

  private toView(m: RequestMessage): MessageView {
    return {
      id: m.id,
      body: m.isWithdrawn ? WITHDRAWN_PLACEHOLDER : m.body,
      isInternal: m.isInternal,
      isWithdrawn: m.isWithdrawn,
      withdrawalReason: m.withdrawalReason,
      createdAt: m.createdAt,
      author: m.author
        ? {
            id: m.author.id,
            firstName: m.author.firstName,
            lastName: m.author.lastName,
            roleId: m.author.roleId,
          }
        : null,
    };
  }
}
