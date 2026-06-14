import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import { Organization, User } from '../database/entities';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

/** Rôles internes éligibles comme responsable par défaut d'une organisation. */
const DEFAULT_ASSIGNEE_ROLES = ['ADMIN', 'RESPONSABLE'];

/**
 * Un responsable par défaut doit être un utilisateur actif, de portail interne
 * et de rôle ADMIN ou RESPONSABLE (fonction pure, testable unitairement).
 */
export function isEligibleDefaultAssignee(
  user: Pick<User, 'isActive' | 'roleId'> & {
    role?: { scope: string } | null;
  },
): boolean {
  return Boolean(
    user.isActive &&
    user.role &&
    user.role.scope === 'INTERNAL' &&
    DEFAULT_ASSIGNEE_ROLES.includes(user.roleId),
  );
}

/** Colonnes sûres du responsable exposées via l'organisation (jamais de secret). */
const ASSIGNEE_SAFE_COLUMNS = [
  'assignee.id',
  'assignee.firstName',
  'assignee.lastName',
  'assignee.roleId',
  'assignee.email',
];

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /**
   * Vérifie qu'un responsable par défaut est un utilisateur interne actif de
   * rôle ADMIN ou RESPONSABLE. Retourne l'id validé (ou null si non fourni).
   */
  private async validateDefaultAssignee(
    userId: string | null | undefined,
  ): Promise<string | null> {
    if (!userId) return null;
    const user = await this.users.findOne({
      where: { id: userId, deletedAt: IsNull() },
      relations: { role: true },
    });
    if (!user) {
      throw new BadRequestException({
        code: 'DEFAULT_ASSIGNEE_NOT_FOUND',
        message: "L'utilisateur sélectionné est introuvable ou inactif.",
      });
    }
    if (!isEligibleDefaultAssignee(user)) {
      throw new BadRequestException({
        code: 'DEFAULT_ASSIGNEE_INVALID_ROLE',
        message:
          'Le responsable par défaut doit être un administrateur ou un responsable actif.',
      });
    }
    return user.id;
  }

  async list(params: {
    cursor?: string;
    limit?: number;
  }): Promise<CursorPage<Organization>> {
    const limit = params.limit ?? 25;
    const decoded = decodeCursor(params.cursor);

    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.country', 'country')
      .leftJoinAndSelect('o.city', 'city')
      // Projection restreinte : ne JAMAIS exposer passwordHash & co. du responsable.
      .leftJoin('o.defaultAssignee', 'assignee')
      .addSelect(ASSIGNEE_SAFE_COLUMNS)
      .where('o.deleted_at IS NULL');
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
    const org = await this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.country', 'country')
      .leftJoinAndSelect('o.city', 'city')
      // Projection restreinte : ne JAMAIS exposer passwordHash & co. du responsable.
      .leftJoin('o.defaultAssignee', 'assignee')
      .addSelect(ASSIGNEE_SAFE_COLUMNS)
      .where('o.id = :id AND o.deleted_at IS NULL', { id })
      .getOne();
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
    const defaultAssigneeUserId = await this.validateDefaultAssignee(
      dto.defaultAssigneeUserId,
    );
    const org = this.repo.create({
      name: dto.name,
      externalReference: dto.externalReference ?? null,
      addressLine: dto.addressLine ?? null,
      countryId: dto.countryId ?? null,
      cityId: dto.cityId ?? null,
      primaryContactEmail: dto.primaryContactEmail ?? null,
      defaultAssigneeUserId,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.repo.save(org);
    return this.findById(saved.id);
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
    if (dto.countryId !== undefined) org.countryId = dto.countryId ?? null;
    if (dto.cityId !== undefined) org.cityId = dto.cityId ?? null;
    if (dto.primaryContactEmail !== undefined)
      org.primaryContactEmail = dto.primaryContactEmail;
    if (dto.defaultAssigneeUserId !== undefined) {
      org.defaultAssigneeUserId = await this.validateDefaultAssignee(
        dto.defaultAssigneeUserId,
      );
      // La relation hydratée (chargée par findById) prime sur la colonne lors du
      // save : on la neutralise pour que la valeur de la colonne fasse foi.
      org.defaultAssignee = null;
    }
    if (dto.isActive !== undefined) org.isActive = dto.isActive;
    await this.repo.save(org);
    return this.findById(org.id);
  }

  async deactivate(id: string): Promise<void> {
    const org = await this.findById(id);
    await this.repo.softRemove(org);
  }
}
