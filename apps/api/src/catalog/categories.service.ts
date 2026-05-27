import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import { Category } from '../database/entities';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
  ) {}

  async list(params: {
    cursor?: string;
    limit?: number;
    activeOnly?: boolean;
  }): Promise<CursorPage<Category>> {
    const limit = params.limit ?? 25;
    const decoded = decodeCursor(params.cursor);

    const qb = this.repo.createQueryBuilder('c').where('c.deleted_at IS NULL');
    if (params.activeOnly) {
      qb.andWhere('c.is_active = :a', { a: true });
    }
    if (decoded) {
      qb.andWhere('(c.created_at, c.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: decoded.createdAt,
        cursorId: decoded.id,
      });
    }
    qb.orderBy('c.created_at', 'DESC')
      .addOrderBy('c.id', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];

    return {
      items,
      page_info: {
        has_next: hasNext,
        next_cursor:
          hasNext && last
            ? encodeCursor({
                id: last.id,
                createdAt: last.createdAt.toISOString(),
              })
            : null,
      },
    };
  }

  async findById(id: string): Promise<Category> {
    const cat = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!cat) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND' });
    }
    return cat;
  }

  async findByCode(code: string): Promise<Category | null> {
    return this.repo.findOne({ where: { code, deletedAt: IsNull() } });
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.findByCode(dto.code);
    if (existing) {
      throw new ConflictException({
        code: 'CATEGORY_CODE_TAKEN',
        message: `Une catégorie active utilise déjà le code "${dto.code}".`,
      });
    }
    const created = this.repo.create({
      code: dto.code,
      label: dto.label,
      description: dto.description ?? null,
      defaultPriorityId: dto.defaultPriorityId,
      requiresBugDetails: dto.requiresBugDetails ?? false,
      defaultResponsibleTeam: dto.defaultResponsibleTeam ?? null,
      isActive: dto.isActive ?? true,
      isReserved: dto.isReserved ?? false,
    });
    return this.repo.save(created);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const cat = await this.findById(id);
    if (dto.code !== undefined && dto.code !== cat.code) {
      const clash = await this.findByCode(dto.code);
      if (clash && clash.id !== cat.id) {
        throw new ConflictException({ code: 'CATEGORY_CODE_TAKEN' });
      }
      cat.code = dto.code;
    }
    if (dto.label !== undefined) cat.label = dto.label;
    if (dto.description !== undefined) cat.description = dto.description;
    if (dto.defaultPriorityId !== undefined)
      cat.defaultPriorityId = dto.defaultPriorityId;
    if (dto.requiresBugDetails !== undefined)
      cat.requiresBugDetails = dto.requiresBugDetails;
    if (dto.defaultResponsibleTeam !== undefined)
      cat.defaultResponsibleTeam = dto.defaultResponsibleTeam;
    if (dto.isActive !== undefined) cat.isActive = dto.isActive;
    if (dto.isReserved !== undefined) cat.isReserved = dto.isReserved;
    return this.repo.save(cat);
  }

  /**
   * Désactivation logique. Une catégorie soft-deleted ne peut plus être
   * sélectionnée à la création d'une demande, mais les demandes existantes
   * conservent leur référence (CDC §3.5 [EXG-03-032]).
   */
  async deactivate(id: string): Promise<void> {
    const cat = await this.findById(id);
    await this.repo.softRemove(cat);
  }
}

// Helpers TypeORM ré-exposés pour clarté (évite import direct dans le service)
export { LessThan, MoreThan };
