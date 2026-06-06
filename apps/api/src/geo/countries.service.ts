import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import { Country } from '../database/entities';
import type { CreateCountryDto, UpdateCountryDto } from './dto/country.dto';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country) private readonly repo: Repository<Country>,
  ) {}

  async list(params: {
    cursor?: string;
    limit?: number;
    activeOnly?: boolean;
  }): Promise<CursorPage<Country>> {
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
    qb.orderBy('c.name', 'ASC')
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

  async findById(id: string): Promise<Country> {
    const country = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!country) {
      throw new NotFoundException({ code: 'COUNTRY_NOT_FOUND' });
    }
    return country;
  }

  async findByCode(code: string): Promise<Country | null> {
    return this.repo.findOne({
      where: { code: code.toUpperCase(), deletedAt: IsNull() },
    });
  }

  async create(dto: CreateCountryDto): Promise<Country> {
    const code = dto.code.toUpperCase();
    const existing = await this.findByCode(code);
    if (existing) {
      throw new ConflictException({
        code: 'COUNTRY_CODE_TAKEN',
        message: `Un pays actif utilise déjà le code "${code}".`,
      });
    }
    const created = this.repo.create({
      code,
      name: dto.name,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(created);
  }

  async update(id: string, dto: UpdateCountryDto): Promise<Country> {
    const country = await this.findById(id);
    if (dto.code !== undefined) {
      const code = dto.code.toUpperCase();
      if (code !== country.code) {
        const clash = await this.findByCode(code);
        if (clash && clash.id !== country.id) {
          throw new ConflictException({ code: 'COUNTRY_CODE_TAKEN' });
        }
        country.code = code;
      }
    }
    if (dto.name !== undefined) country.name = dto.name;
    if (dto.isActive !== undefined) country.isActive = dto.isActive;
    return this.repo.save(country);
  }

  /** Désactivation logique. Les villes rattachées suivent en cascade côté FK. */
  async deactivate(id: string): Promise<void> {
    const country = await this.findById(id);
    await this.repo.softRemove(country);
  }
}
