import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestDraft } from '../database/entities';
import type { UpsertDraftDto } from './dto/draft.dto';

/**
 * Brouillons de demande — appartiennent à un Client unique (l'auteur).
 * Sprint 3 livre le strict nécessaire pour la sauvegarde inter-étapes
 * du formulaire de création. Purge planifiée (TTL 30j) ajoutée au S5.
 */
@Injectable()
export class DraftsService {
  constructor(
    @InjectRepository(RequestDraft)
    private readonly drafts: Repository<RequestDraft>,
  ) {}

  async create(
    ownerUserId: string,
    dto: UpsertDraftDto,
  ): Promise<RequestDraft> {
    const draft = this.drafts.create({
      ownerUserId,
      payload: dto.payload,
      step: dto.step,
    });
    return this.drafts.save(draft);
  }

  async update(
    ownerUserId: string,
    id: string,
    dto: UpsertDraftDto,
  ): Promise<RequestDraft> {
    const draft = await this.ensureOwned(ownerUserId, id);
    draft.payload = dto.payload;
    draft.step = dto.step;
    return this.drafts.save(draft);
  }

  async listMine(ownerUserId: string): Promise<RequestDraft[]> {
    return this.drafts.find({
      where: { ownerUserId },
      order: { updatedAt: 'DESC' },
      take: 20,
    });
  }

  async getMine(ownerUserId: string, id: string): Promise<RequestDraft> {
    return this.ensureOwned(ownerUserId, id);
  }

  async deleteMine(ownerUserId: string, id: string): Promise<void> {
    const draft = await this.ensureOwned(ownerUserId, id);
    await this.drafts.delete(draft.id);
  }

  private async ensureOwned(
    ownerUserId: string,
    id: string,
  ): Promise<RequestDraft> {
    const draft = await this.drafts.findOne({ where: { id } });
    if (!draft) {
      throw new NotFoundException({ code: 'DRAFT_NOT_FOUND' });
    }
    if (draft.ownerUserId !== ownerUserId) {
      // Anti-énumération : on retourne 404 plutôt que 403.
      throw new NotFoundException({ code: 'DRAFT_NOT_FOUND' });
    }
    if (!ownerUserId) {
      throw new ForbiddenException({ code: 'NOT_DRAFT_OWNER' });
    }
    return draft;
  }
}
