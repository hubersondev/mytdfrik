import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import { Organization } from '../database/entities';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
  ) {}

  async list(params: {
    cursor?: string;
    limit?: number;
  }): Promise<CursorPage<Organization>> {
    const limit = params.limit ?? 25;
    const decoded = decodeCursor(params.cursor);

    const qb = this.repo.createQueryBuilder('o').where('o.deleted_at IS NULL');
    if (decoded) {
      qb.andWhere('(o.created_at, o.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: decoded.createdAt,
        cursorId: decoded.id,
      });
    }
    qb.orderBy('o.created_at', 'DESC')
      .addOrderBy('o.id', 'DESC')
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

  async findById(id: string): Promise<Organization> {
    const org = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!org) {
      throw new NotFoundException({ code: 'ORGANIZATION_NOT_FOUND' });
    }
    return org;
  }

  async findByName(name: string): Promise<Organization | null> {
    return this.repo
      .createQueryBuilder('o')
      .where('LOWER(o.name) = LOWER(:name) AND o.deleted_at IS NULL', { name })
      .getOne();
  }

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const clash = await this.findByName(dto.name);
    if (clash) {
      throw new ConflictException({ code: 'ORGANIZATION_NAME_TAKEN' });
    }
    const org = this.repo.create({
      name: dto.name,
      externalReference: dto.externalReference ?? null,
      addressLine: dto.addressLine ?? null,
      city: dto.city ?? null,
      country: dto.country ?? null,
      primaryContactEmail: dto.primaryContactEmail ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.repo.save(org);
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findById(id);
    if (dto.name !== undefined && dto.name !== org.name) {
      const clash = await this.findByName(dto.name);
      if (clash && clash.id !== org.id) {
        throw new ConflictException({ code: 'ORGANIZATION_NAME_TAKEN' });
      }
      org.name = dto.name;
    }
    if (dto.externalReference !== undefined)
      org.externalReference = dto.externalReference;
    if (dto.addressLine !== undefined) org.addressLine = dto.addressLine;
    if (dto.city !== undefined) org.city = dto.city;
    if (dto.country !== undefined) org.country = dto.country;
    if (dto.primaryContactEmail !== undefined)
      org.primaryContactEmail = dto.primaryContactEmail;
    if (dto.isActive !== undefined) org.isActive = dto.isActive;
    return this.repo.save(org);
  }

  async deactivate(id: string): Promise<void> {
    const org = await this.findById(id);
    await this.repo.softRemove(org);
  }
}
