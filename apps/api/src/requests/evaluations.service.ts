import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Evaluation, Request } from '../database/entities';
import { NOTIFY_EVENT } from '../notifications/notification-events';
import type { SubmitEvaluationDto } from './dto/evaluation.dto';
import type { TransitionViewer } from './transitions.service';

/**
 * Évaluations de satisfaction (CDC §8.4.12). Proposée au Client à la clôture
 * (T16) : score 1-5 + commentaire optionnel. Une seule évaluation par demande.
 */
@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluations: Repository<Evaluation>,
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    private readonly events: EventEmitter2,
  ) {}

  async get(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<Evaluation | null> {
    await this.loadReadable(viewer, requestId);
    return this.evaluations.findOne({ where: { requestId } });
  }

  async submit(
    viewer: TransitionViewer,
    requestId: string,
    dto: SubmitEvaluationDto,
  ): Promise<Evaluation> {
    const req = await this.loadReadable(viewer, requestId);
    if (viewer.scope !== 'CLIENT' || req.createdByUserId !== viewer.id) {
      throw new ForbiddenException({
        code: 'ONLY_OWNER_CAN_EVALUATE',
        message: 'Seul le Client propriétaire peut évaluer la demande.',
      });
    }
    if (req.status !== 'CLOTUREE') {
      throw new ConflictException({
        code: 'REQUEST_NOT_CLOSED',
        message:
          "L'évaluation n'est possible qu'après la clôture de la demande.",
      });
    }
    const existing = await this.evaluations.findOne({ where: { requestId } });
    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_EVALUATED',
        message: 'Cette demande a déjà été évaluée.',
      });
    }
    const saved = await this.evaluations.save(
      this.evaluations.create({
        requestId,
        score: dto.score,
        comment: dto.comment?.trim() || null,
        submittedByUserId: viewer.id,
      }),
    );

    // Évaluation basse → alerte des Gestionnaires (CDC §7, EVALUATION_BASSE).
    if (dto.score <= 2) {
      this.events.emit(NOTIFY_EVENT, {
        eventCode: 'EVALUATION_BASSE',
        requestId,
        actorUserId: viewer.id,
        actionSummary: `Note ${dto.score}/5${dto.comment ? ` — ${dto.comment.trim().slice(0, 200)}` : ''}`,
      });
    }
    return saved;
  }

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
}
