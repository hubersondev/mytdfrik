import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import {
  Category,
  REQUEST_STATUS_VALUES,
  Request,
  User,
} from '../database/entities';
import type { RequestStatus, RoleCode } from '../database/entities';
import { MailService } from '../mail/mail.service';
import type { CreateRequestDto } from './dto/create-request.dto';
import type { SortKey } from './dto/list-requests.dto';
import { computeSystemPriority } from './priority-matrix';
import {
  formatLocalDateTime,
  priorityLabel,
  statusLabel,
} from './request-labels';

export interface RequestViewer {
  id: string;
  roleId: RoleCode;
  organizationId: string | null;
}

/**
 * Service des demandes — Sprint 3 livre la **création** côté Client
 * (statut `NOUVELLE`) et la consultation par le propriétaire. Les
 * transitions et la gestion par Gestionnaire/Responsable arrivent au S4+.
 */
@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(Request) private readonly requests: Repository<Request>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // -------------------- Création --------------------

  async create(viewer: RequestViewer, dto: CreateRequestDto): Promise<Request> {
    if (viewer.roleId !== 'CLIENT') {
      throw new ForbiddenException({
        code: 'ONLY_CLIENT_CAN_CREATE_REQUEST',
        message: 'Seul un Client peut créer une demande.',
      });
    }
    if (!viewer.organizationId) {
      throw new ForbiddenException({
        code: 'CLIENT_REQUIRES_ORGANIZATION',
        message: "Votre compte Client n'est pas rattaché à une organisation.",
      });
    }

    const category = await this.categories.findOne({
      where: { id: dto.categoryId, deletedAt: IsNull() },
    });
    if (!category) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND' });
    }
    if (!category.isActive) {
      throw new BadRequestException({
        code: 'CATEGORY_INACTIVE',
        message: "Cette catégorie n'accepte plus de nouvelles demandes.",
      });
    }

    const systemPriority = computeSystemPriority(
      dto.impact,
      dto.urgency,
      category.defaultPriorityId,
    );

    // Génération atomique du public_reference côté DB + insert dans la même
    // transaction pour éviter les "trous" si l'insert échoue après l'incrément.
    const created = await this.dataSource.transaction(async (manager) => {
      const refResult = await manager.query<Array<{ ref: string }>>(
        `SELECT next_public_request_reference() AS ref`,
      );
      const publicReference = refResult[0]?.ref;
      if (!publicReference) {
        throw new Error('Impossible de générer le public_reference.');
      }

      const repo = manager.getRepository(Request);
      const entity = new Request();
      entity.publicReference = publicReference;
      entity.createdByUserId = viewer.id;
      entity.organizationId = viewer.organizationId as string;
      entity.categoryId = category.id;
      entity.title = dto.title.trim();
      entity.description = dto.description.trim();
      entity.impact = dto.impact;
      entity.urgency = dto.urgency;
      entity.clientContextNote = dto.clientContextNote?.trim() ?? null;
      entity.systemPriorityId = systemPriority;
      entity.effectivePriorityId = systemPriority;
      entity.status = 'NOUVELLE';
      return repo.save(entity);
    });

    // Envoi best-effort de l'accusé de réception (CDC §7.6, annexe A4).
    // Échec d'envoi ne casse pas la création — la retry queue arrive au S8.
    void this.sendAcknowledgement(created.id).catch((error) => {
      this.logger.error(
        `Échec envoi accusé de réception pour ${created.publicReference}`,
        error as Error,
      );
    });

    return created;
  }

  private async sendAcknowledgement(requestId: string): Promise<void> {
    const request = await this.requests.findOne({
      where: { id: requestId },
      relations: { createdBy: true },
    });
    if (!request || !request.createdBy) {
      return;
    }
    const baseUrl = this.config.get<string>(
      'APP_WEB_BASE_URL',
      'http://localhost:3001',
    );
    await this.mail.send({
      to: request.createdBy.email,
      template: 'ACCUSE_RECEPTION',
      variables: {
        first_name: request.createdBy.firstName,
        public_reference: request.publicReference,
        title: request.title,
        created_at_local: formatLocalDateTime(
          request.createdAt,
          request.createdBy.timeZone,
        ),
        status_label: statusLabel(request.status),
        priority_label: priorityLabel(request.effectivePriorityId),
        request_url: `${baseUrl.replace(/\/$/, '')}/client/requests/${request.publicReference}`,
      },
    });
  }

  // -------------------- Lecture --------------------

  async findById(viewer: RequestViewer, id: string): Promise<Request> {
    const req = await this.requests.findOne({
      where: { id, deletedAt: IsNull() },
      relations: {
        category: true,
        systemPriority: true,
        effectivePriority: true,
      },
    });
    if (!req) {
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }
    this.assertReadable(viewer, req);
    return req;
  }

  async findByPublicReference(
    viewer: RequestViewer,
    reference: string,
  ): Promise<Request> {
    const req = await this.requests.findOne({
      where: { publicReference: reference, deletedAt: IsNull() },
      relations: {
        category: true,
        systemPriority: true,
        effectivePriority: true,
      },
    });
    if (!req) {
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }
    this.assertReadable(viewer, req);
    return req;
  }

  async list(
    viewer: RequestViewer,
    params: {
      cursor?: string;
      limit?: number;
      status?: string | string[];
      sort?: SortKey;
    },
  ): Promise<CursorPage<Request>> {
    const limit = params.limit ?? 25;
    const sort: SortKey = params.sort ?? 'activity_desc';
    const decoded = decodeCursor(params.cursor);

    const qb = this.requests
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.category', 'c')
      .leftJoinAndSelect('r.effectivePriority', 'p')
      .where('r.deleted_at IS NULL');

    if (viewer.roleId === 'CLIENT') {
      // Le Client ne voit que les demandes de son organisation.
      if (!viewer.organizationId) {
        return { items: [], page_info: { has_next: false, next_cursor: null } };
      }
      qb.andWhere('r.organization_id = :orgId', {
        orgId: viewer.organizationId,
      });
    }
    // Les rôles internes (GESTIONNAIRE, RESPONSABLE, ADMIN, DG) voient tout.
    // Le périmètre par responsable affecté arrivera au S4 via un filtre dédié.

    if (params.status) {
      const statuses = Array.isArray(params.status)
        ? params.status
        : [params.status];
      const cleaned = statuses.filter((s) =>
        REQUEST_STATUS_VALUES.includes(s as RequestStatus),
      );
      if (cleaned.length === 1) {
        qb.andWhere('r.status = :status', { status: cleaned[0] });
      } else if (cleaned.length > 1) {
        qb.andWhere('r.status IN (:...statuses)', { statuses: cleaned });
      }
    }

    // Le curseur opaque encode (created_at, id) — il n'est applicable qu'avec
    // le tri par défaut. Pour les autres tris on saute la pagination (S3 :
    // limites maximales ≤ 100 par page, suffisant pour le panel pilote).
    if (decoded && sort === 'activity_desc') {
      qb.andWhere('(r.updated_at, r.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: decoded.createdAt,
        cursorId: decoded.id,
      });
    }

    switch (sort) {
      case 'created_desc':
        qb.orderBy('r.created_at', 'DESC').addOrderBy('r.id', 'DESC');
        break;
      case 'created_asc':
        qb.orderBy('r.created_at', 'ASC').addOrderBy('r.id', 'ASC');
        break;
      case 'priority_asc':
        // P0 < P1 < ... < P4 lexicographiquement. Tri secondaire par activité
        // pour départager deux demandes de même priorité.
        qb.orderBy('r.effective_priority_id', 'ASC')
          .addOrderBy('r.updated_at', 'DESC')
          .addOrderBy('r.id', 'DESC');
        break;
      case 'activity_desc':
      default:
        qb.orderBy('r.updated_at', 'DESC').addOrderBy('r.id', 'DESC');
        break;
    }
    qb.take(limit + 1);

    const rows = await qb.getMany();
    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    // Le curseur n'est exposé que pour le tri par défaut (activity_desc) ;
    // les autres tris se limitent à la première page côté Sprint 3.
    const nextCursor =
      hasNext && last && sort === 'activity_desc'
        ? encodeCursor({ id: last.id, createdAt: last.updatedAt.toISOString() })
        : null;
    return {
      items,
      page_info: {
        has_next: Boolean(nextCursor),
        next_cursor: nextCursor,
      },
    };
  }

  // -------------------- Helpers --------------------

  private assertReadable(viewer: RequestViewer, req: Request): void {
    if (
      viewer.roleId === 'CLIENT' &&
      req.organizationId !== viewer.organizationId
    ) {
      // On masque l'existence pour éviter l'énumération (CDC §10.3 [EXG-10-052]).
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND' });
    }
  }
}
