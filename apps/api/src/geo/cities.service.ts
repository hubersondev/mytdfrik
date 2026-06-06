import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import { City, Country } from '../database/entities';
import type { CreateCityDto, UpdateCityDto } from './dto/city.dto';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City) private readonly repo: Repository<City>,
    @InjectRepository(Country) private readonly countries: Repository<Country>,
  ) {}

  async list(params: {
    cursor?: string;
    limit?: number;
    countryId?: string;
    activeOnly?: boolean;
  }): Promise<CursorPage<City>> {
    const limit = params.limit ?? 25;
    const decoded = decodeCursor(params.cursor);

    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.country', 'country')
      .where('c.deleted_at IS NULL');
    if (params.countryId) {
      qb.andWhere('c.country_id = :countryId', { countryId: params.countryId });
    }
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

  async findById(id: string): Promise<City> {
    const city = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { country: true },
    });
    if (!city) {
      throw new NotFoundException({ code: 'CITY_NOT_FOUND' });
    }
    return city;
  }

  private async assertCountryExists(countryId: string): Promise<void> {
    const country = await this.countries.findOne({
      where: { id: countryId, deletedAt: IsNull() },
    });
    if (!country) {
      throw new NotFoundException({ code: 'COUNTRY_NOT_FOUND' });
    }
  }

  private async findByName(
    countryId: string,
    name: string,
  ): Promise<City | null> {
    return this.repo.findOne({
      where: { countryId, name, deletedAt: IsNull() },
    });
  }

  async create(dto: CreateCityDto): Promise<City> {
    await this.assertCountryExists(dto.countryId);
    const clash = await this.findByName(dto.countryId, dto.name);
    if (clash) {
      throw new ConflictException({
        code: 'CITY_NAME_TAKEN',
        message: `La ville "${dto.name}" existe déjà pour ce pays.`,
      });
    }
    const created = this.repo.create({
      countryId: dto.countryId,
      name: dto.name,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.repo.save(created);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateCityDto): Promise<City> {
    const city = await this.findById(id);
    const nextCountryId = dto.countryId ?? city.countryId;
    const nextName = dto.name ?? city.name;

    if (dto.countryId !== undefined && dto.countryId !== city.countryId) {
      await this.assertCountryExists(dto.countryId);
    }
    if (
      (dto.countryId !== undefined && dto.countryId !== city.countryId) ||
      (dto.name !== undefined && dto.name !== city.name)
    ) {
      const clash = await this.findByName(nextCountryId, nextName);
      if (clash && clash.id !== city.id) {
        throw new ConflictException({ code: 'CITY_NAME_TAKEN' });
      }
    }
    if (dto.countryId !== undefined) city.countryId = dto.countryId;
    if (dto.name !== undefined) city.name = dto.name;
    if (dto.isActive !== undefined) city.isActive = dto.isActive;
    await this.repo.save(city);
    return this.findById(city.id);
  }

  async deactivate(id: string): Promise<void> {
    const city = await this.findById(id);
    await this.repo.softRemove(city);
  }
}
