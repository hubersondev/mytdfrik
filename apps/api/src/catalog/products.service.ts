import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import { Product } from '../database/entities';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  async list(params: {
    cursor?: string;
    limit?: number;
    activeOnly?: boolean;
  }): Promise<CursorPage<Product>> {
    const limit = params.limit ?? 25;
    const decoded = decodeCursor(params.cursor);

    const qb = this.repo.createQueryBuilder('p').where('p.deleted_at IS NULL');
    if (params.activeOnly) {
      qb.andWhere('p.is_active = :a', { a: true });
    }
    if (decoded) {
      qb.andWhere('(p.created_at, p.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: decoded.createdAt,
        cursorId: decoded.id,
      });
    }
    qb.orderBy('p.created_at', 'DESC')
      .addOrderBy('p.id', 'DESC')
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

  async findById(id: string): Promise<Product> {
    const p = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!p) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND' });
    }
    return p;
  }

  async findByCode(code: string): Promise<Product | null> {
    return this.repo.findOne({ where: { code, deletedAt: IsNull() } });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.findByCode(dto.code);
    if (existing) {
      throw new ConflictException({ code: 'PRODUCT_CODE_TAKEN' });
    }
    const created = this.repo.create({
      code: dto.code,
      label: dto.label,
      description: dto.description ?? null,
      defaultOwnerTeam: dto.defaultOwnerTeam ?? null,
      requiresOs: dto.requiresOs ?? false,
      requiresBrowser: dto.requiresBrowser ?? false,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(created);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const p = await this.findById(id);
    if (dto.code !== undefined && dto.code !== p.code) {
      const clash = await this.findByCode(dto.code);
      if (clash && clash.id !== p.id) {
        throw new ConflictException({ code: 'PRODUCT_CODE_TAKEN' });
      }
      p.code = dto.code;
    }
    if (dto.label !== undefined) p.label = dto.label;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.defaultOwnerTeam !== undefined)
      p.defaultOwnerTeam = dto.defaultOwnerTeam;
    if (dto.requiresOs !== undefined) p.requiresOs = dto.requiresOs;
    if (dto.requiresBrowser !== undefined)
      p.requiresBrowser = dto.requiresBrowser;
    if (dto.isActive !== undefined) p.isActive = dto.isActive;
    return this.repo.save(p);
  }

  async deactivate(id: string): Promise<void> {
    const p = await this.findById(id);
    await this.repo.softRemove(p);
  }
}
