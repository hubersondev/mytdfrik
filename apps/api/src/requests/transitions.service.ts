import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Request, RequestStateHistory, User } from '../database/entities';
import type {
  PriorityLevelCode,
  RequestStatus,
  RoleScope,
} from '../database/entities';
import type { ApplyTransitionDto } from './dto/apply-transition.dto';
import {
  isTransitionCode,
  resolveClientReplyTarget,
  TRANSITIONS,
  transitionsFrom,
  type TransitionDef,
} from './state-machine';

export interface TransitionViewer {
  id: string;
  scope: RoleScope;
  permissions: string[];
  organizationId: string | null;
}

/** Réhausse la priorité d'un cran, plafonnée à P1 (CDC §4.6 — réouverture). */
const PRIORITY_LADDER: PriorityLevelCode[] = ['P4', 'P3', 'P2', 'P1', 'P0'];
function bumpPriorityCapP1(current: PriorityLevelCode): PriorityLevelCode {
  if (current === 'P0' || current === 'P1') return 'P1';
  const idx = PRIORITY_LADDER.indexOf(current);
  const bumped = PRIORITY_LADDER[idx + 1] ?? current;
  return bumped === 'P0' ? 'P1' : bumped;
}

const REOPEN_WINDOW_DAYS = 30;
const MAX_REOPENS = 2;

/**
 * Moteur de transitions de demandes (CDC §4). Fait foi côté serveur :
 * valide le statut source, le verrou optimiste, l'acteur (permission ou
 * propriété Client), le motif requis, applique les effets et journalise.
 */
@Injectable()
export class TransitionsService {
  constructor(
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RequestStateHistory)
    private readonly history: Repository<RequestStateHistory>,
    private readonly dataSource: DataSource,
  ) {}

  /** Historique des transitions d'une demande (ordre chronologique). */
  async listHistory(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<RequestStateHistory[]> {
    const req = await this.requests.findOne({
      where: { id: requestId, deletedAt: IsNull() },
    });
    if (!req) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    this.assertReadable(viewer, req);
    return this.history.find({
      where: { requestId },
      relations: { actor: true },
      order: { createdAt: 'ASC' },
    });
  }

  /** Liste les transitions applicables par ce viewer sur cette demande (UI). */
  async availableTransitions(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<string[]> {
    const req = await this.requests.findOne({
      where: { id: requestId, deletedAt: IsNull() },
    });
    if (!req) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    this.assertReadable(viewer, req);
    return transitionsFrom(req.status)
      .filter((t) => this.canActorTrigger(viewer, t, req))
      .map((t) => t.code);
  }

  async apply(
    viewer: TransitionViewer,
    requestId: string,
    code: string,
    dto: ApplyTransitionDto,
  ): Promise<Request> {
    if (!isTransitionCode(code)) {
      throw new NotFoundException({ code: 'UNKNOWN_TRANSITION' });
    }
    const def = TRANSITIONS[code];

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Request);
      const req = await repo.findOne({
        where: { id: requestId, deletedAt: IsNull() },
      });
      if (!req) throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });

      this.assertReadable(viewer, req);

      // Statut source autorisé pour cette transition.
      if (!def.from.includes(req.status)) {
        throw new ConflictException({
          code: 'INVALID_TRANSITION_FOR_STATUS',
          message: `La transition ${code} n'est pas applicable depuis le statut ${req.status}.`,
          details: { currentStatus: req.status },
        });
      }

      // Verrou optimiste applicatif (CDC §4.4 [EXG-04-012], §4.7.4).
      if (dto.expectedStatus !== req.status) {
        throw new ConflictException({
          code: 'STATUS_CONFLICT',
          message:
            'La demande a évolué entre-temps. Rafraîchissez puis réessayez.',
          details: { currentStatus: req.status },
        });
      }

      // Acteur autorisé (CDC §4.7.3 → 403).
      if (!this.canActorTrigger(viewer, def, req)) {
        throw new ForbiddenException({
          code: 'TRANSITION_FORBIDDEN',
          message: 'Votre rôle ne permet pas cette action sur cette demande.',
        });
      }

      const note = dto.note?.trim() || null;
      if (def.requiresNote && !note) {
        throw new BadRequestException({
          code: 'NOTE_REQUIRED',
          message: 'Un motif ou message est obligatoire pour cette action.',
        });
      }

      // Cible (dynamique pour CLIENT_REPLY).
      let targetStatus: RequestStatus;
      let historyCode: string = code;
      if (def.to === null) {
        const resolved = resolveClientReplyTarget(req.previousStatusBeforeWait);
        if (!resolved) {
          throw new ConflictException({ code: 'NO_PREVIOUS_STATUS' });
        }
        targetStatus = resolved.to;
        historyCode = resolved.effectiveCode;
      } else {
        targetStatus = def.to;
      }

      const fromStatus = req.status;
      await this.applyEffects(
        manager,
        viewer,
        def,
        req,
        targetStatus,
        note,
        dto,
      );

      req.status = targetStatus;
      await repo.save(req);

      await manager.getRepository(RequestStateHistory).insert({
        requestId: req.id,
        transitionCode: historyCode,
        fromStatus,
        toStatus: targetStatus,
        actorUserId: def.actor.kind === 'SYSTEM' ? null : viewer.id,
        note,
        event: def.event,
      });

      // TODO S8 : émettre def.event vers le module de notifications (WebSocket + e-mail).
      return req;
    });
  }

  // -------------------- Effets par transition --------------------

  private async applyEffects(
    manager: import('typeorm').EntityManager,
    viewer: TransitionViewer,
    def: TransitionDef,
    req: Request,
    target: RequestStatus,
    note: string | null,
    dto: ApplyTransitionDto,
  ): Promise<void> {
    const now = new Date();

    // Mémorise le statut antérieur lors d'une mise en attente client.
    if (target === 'EN_ATTENTE_CLIENT') {
      req.previousStatusBeforeWait = req.status;
    }

    switch (def.code) {
      case 'T02': {
        req.qualifiedByUserId = viewer.id;
        req.qualifiedAt = now;
        if (
          dto.effectivePriorityId &&
          dto.effectivePriorityId !== req.effectivePriorityId
        ) {
          if (!note) {
            throw new BadRequestException({
              code: 'PRIORITY_OVERRIDE_REASON_REQUIRED',
              message: 'Un motif est obligatoire pour ajuster la priorité.',
            });
          }
          req.effectivePriorityId = dto.effectivePriorityId;
          req.priorityOverrideReason = note;
        }
        break;
      }
      case 'T05':
        req.rejectionReason = note;
        break;
      case 'T04':
        req.cancellationReason = note;
        break;
      case 'T06':
        await this.assignResponsible(manager, viewer, req, dto.assigneeId);
        break;
      case 'T08':
        if (!req.firstResponseAt) req.firstResponseAt = now;
        break;
      case 'T09':
      case 'T12':
        // Refus / réaffectation : la demande retourne en file, on libère le responsable.
        req.assignedToUserId = null;
        break;
      case 'T11':
        req.resolvedAt = now;
        break;
      case 'T16':
        req.closedAt = now;
        break;
      case 'T19':
        this.applyReopen(req, now);
        break;
      case 'CLIENT_REPLY':
        // Reprise après attente client : on efface le marqueur.
        req.previousStatusBeforeWait = null;
        break;
      default:
        break;
    }
  }

  private async assignResponsible(
    manager: import('typeorm').EntityManager,
    viewer: TransitionViewer,
    req: Request,
    assigneeId: string | undefined,
  ): Promise<void> {
    if (!assigneeId) {
      throw new BadRequestException({
        code: 'ASSIGNEE_REQUIRED',
        message: 'Sélectionnez un responsable à affecter.',
      });
    }
    const assignee = await manager.getRepository(User).findOne({
      where: { id: assigneeId, deletedAt: IsNull() },
      relations: { role: true },
    });
    if (!assignee || !assignee.isActive) {
      throw new BadRequestException({ code: 'ASSIGNEE_NOT_FOUND' });
    }
    if (!assignee.role || assignee.role.scope !== 'INTERNAL') {
      throw new BadRequestException({
        code: 'ASSIGNEE_NOT_INTERNAL',
        message: 'Le responsable affecté doit être un utilisateur interne.',
      });
    }
    req.assignedToUserId = assignee.id;
    req.assignedByUserId = viewer.id;
  }

  private applyReopen(req: Request, now: Date): void {
    if (req.reopenCount >= MAX_REOPENS) {
      throw new ConflictException({
        code: 'REOPEN_LIMIT_REACHED',
        message: `Une demande ne peut être rouverte que ${MAX_REOPENS} fois.`,
      });
    }
    if (req.closedAt) {
      const deadline = new Date(
        req.closedAt.getTime() + REOPEN_WINDOW_DAYS * 86_400_000,
      );
      if (now > deadline) {
        throw new ConflictException({
          code: 'REOPEN_WINDOW_EXPIRED',
          message: `La réouverture n'est possible que dans les ${REOPEN_WINDOW_DAYS} jours suivant la clôture.`,
        });
      }
    }
    req.reopenCount += 1;
    req.lastReopenedAt = now;
    req.effectivePriorityId = bumpPriorityCapP1(req.effectivePriorityId);
    // Repart en file de qualification : on libère le responsable précédent.
    req.assignedToUserId = null;
  }

  // -------------------- Autorisation --------------------

  private canActorTrigger(
    viewer: TransitionViewer,
    def: TransitionDef,
    req: Request,
  ): boolean {
    switch (def.actor.kind) {
      case 'PERMISSION':
        return viewer.permissions.includes(def.actor.permission);
      case 'CLIENT_OWNER':
        return viewer.scope === 'CLIENT' && req.createdByUserId === viewer.id;
      case 'SYSTEM':
        return false; // jamais déclenchable via l'API
    }
  }

  private assertReadable(viewer: TransitionViewer, req: Request): void {
    if (
      viewer.scope === 'CLIENT' &&
      req.organizationId !== viewer.organizationId
    ) {
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }
  }
}
