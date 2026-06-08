import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import {
  Product,
  Request,
  RequestBugDetail,
  type ImpactValue,
} from '../database/entities';
import type {
  BugDiagnosticDto,
  CreateBugDetailDto,
} from './dto/bug-detail.dto';
import type { TransitionViewer } from './transitions.service';

/** Impacts compatibles avec un bug déclaré bloquant (CDC §6.2.2 [EXG-06-020]). */
const BLOCKING_IMPACTS: ImpactValue[] = ['BLOCAGE_TOTAL', 'BLOCAGE_PARTIEL'];

/**
 * Détails structurés des bugs (CDC §6). Création des champs Client à la
 * soumission (dans la transaction de création de la demande) et consignation
 * du diagnostic par le Responsable avant la résolution (T11).
 */
@Injectable()
export class BugDetailsService {
  constructor(
    @InjectRepository(RequestBugDetail)
    private readonly bugDetails: Repository<RequestBugDetail>,
    @InjectRepository(Request) private readonly requests: Repository<Request>,
  ) {}

  /**
   * Valide et persiste les détails d'un bug dans la transaction de création.
   * `impact` est celui de la demande (pour la contrainte bloquant → BLOCAGE_*).
   */
  async createInTransaction(
    manager: EntityManager,
    requestId: string,
    impact: ImpactValue,
    dto: CreateBugDetailDto,
  ): Promise<void> {
    const product = await manager.getRepository(Product).findOne({
      where: { id: dto.productId, deletedAt: IsNull() },
    });
    if (!product || !product.isActive) {
      throw new BadRequestException({
        code: 'PRODUCT_NOT_FOUND',
        message: "Le produit sélectionné est introuvable ou n'est plus actif.",
      });
    }

    // Contrainte bloquant → impact (CDC §6.2.2 [EXG-06-020]).
    if (dto.isBlocking && !BLOCKING_IMPACTS.includes(impact)) {
      throw new BadRequestException({
        code: 'BLOCKING_BUG_IMPACT_MISMATCH',
        message:
          'Un bug déclaré bloquant impose un impact « Blocage total » ou « Blocage partiel ».',
      });
    }

    // Fréquence obligatoire si récurrent.
    if (dto.isRecurrent && !dto.frequencyLabel) {
      throw new BadRequestException({
        code: 'FREQUENCY_REQUIRED',
        message: 'Indiquez la fréquence pour un bug récurrent.',
      });
    }

    // Champs d'environnement obligatoires selon les métadonnées produit
    // (CDC §6.2.1 [EXG-06-010]).
    if (product.requiresOs && !dto.environmentOs?.trim()) {
      throw new BadRequestException({
        code: 'ENVIRONMENT_OS_REQUIRED',
        message: "Le système d'exploitation est requis pour ce produit.",
      });
    }
    if (product.requiresBrowser && !dto.environmentBrowser?.trim()) {
      throw new BadRequestException({
        code: 'ENVIRONMENT_BROWSER_REQUIRED',
        message: 'Le navigateur est requis pour ce produit.',
      });
    }

    const repo = manager.getRepository(RequestBugDetail);
    await repo.insert({
      requestId,
      productId: product.id,
      productVersion: dto.productVersion.trim(),
      expectedBehavior: dto.expectedBehavior.trim(),
      observedBehavior: dto.observedBehavior.trim(),
      reproductionSteps: dto.reproductionSteps.trim(),
      occurredAt: new Date(dto.occurredAt),
      isRecurrent: dto.isRecurrent,
      frequencyLabel: dto.isRecurrent ? (dto.frequencyLabel ?? null) : null,
      environmentOs: dto.environmentOs?.trim() || null,
      environmentBrowser: dto.environmentBrowser?.trim() || null,
      environmentHardware: dto.environmentHardware?.trim() || null,
      isBlocking: dto.isBlocking,
      errorMessages: dto.errorMessages?.trim() || null,
    });
  }

  /** Détail bug d'une demande (lecture). Retourne null si la demande n'est pas un bug. */
  async get(
    viewer: TransitionViewer,
    requestId: string,
  ): Promise<RequestBugDetail | null> {
    await this.loadReadable(viewer, requestId);
    return this.bugDetails.findOne({
      where: { requestId },
      relations: { product: true },
    });
  }

  /**
   * Consigne le diagnostic du Responsable (CDC §6.3.2 [EXG-06-040], [EXG-06-050]).
   * Requiert la permission `requests.process` (rôle interne traitant).
   */
  async upsertDiagnostic(
    viewer: TransitionViewer,
    requestId: string,
    dto: BugDiagnosticDto,
  ): Promise<RequestBugDetail> {
    if (
      viewer.scope !== 'INTERNAL' ||
      !viewer.permissions.includes('requests.process')
    ) {
      throw new ForbiddenException({
        code: 'DIAGNOSTIC_FORBIDDEN',
        message: 'Seul un responsable traitant peut consigner le diagnostic.',
      });
    }
    const detail = await this.bugDetails.findOne({ where: { requestId } });
    if (!detail) {
      throw new NotFoundException({
        code: 'BUG_DETAILS_NOT_FOUND',
        message: "Cette demande n'est pas un bug structuré.",
      });
    }
    detail.isReproduced = dto.isReproduced;
    detail.rootCause = dto.rootCause.trim();
    detail.correctiveAction = dto.correctiveAction.trim();
    detail.workaround = dto.workaround?.trim() || null;
    detail.fixDeployed = dto.fixDeployed ?? null;
    detail.workaroundOnly = dto.workaroundOnly ?? null;
    if (dto.isKnowledgeBaseEligible !== undefined) {
      detail.isKnowledgeBaseEligible = dto.isKnowledgeBaseEligible;
    }
    return this.bugDetails.save(detail);
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
