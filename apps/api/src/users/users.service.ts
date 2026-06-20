import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { generateOpaqueToken, hashToken } from '../auth/token-hash.util';
import { decodeCursor, encodeCursor } from '../common/cursor.util';
import type { CursorPage } from '../common/dto/pagination.dto';
import {
  AccountActivationToken,
  PasswordResetToken,
  Session,
  User,
} from '../database/entities';
import { RbacService } from '../rbac/rbac.service';
import type {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
} from './dto/user.dto';

export interface UserPublicView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationId: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  timeZone: string;
  createdAt: Date;
}

/**
 * Service utilisateurs (CRUD admin) — CDC §3.3, §9.6.1.
 * Le mot de passe n'est jamais directement écrit ; la création émet un
 * jeton d'activation à transmettre au titulaire par courriel (S3).
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(AccountActivationToken)
    private readonly activationTokens: Repository<AccountActivationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokens: Repository<PasswordResetToken>,
    private readonly config: ConfigService,
    private readonly rbac: RbacService,
  ) {}

  /**
   * Valide qu'un rôle existe (et est résoluble) et applique la règle métier :
   * un rôle de portée CLIENT impose le rattachement à une organisation.
   */
  private async assertRoleAssignable(
    roleId: string,
    organizationId: string | null | undefined,
  ): Promise<void> {
    const access = await this.rbac.resolveAccess(roleId);
    if (!access) {
      throw new BadRequestException({
        code: 'ROLE_NOT_FOUND',
        message: 'Rôle inconnu ou inactif.',
      });
    }
    if (access.scope === 'CLIENT' && !organizationId) {
      throw new BadRequestException({
        code: 'CLIENT_REQUIRES_ORGANIZATION',
        message:
          'Un compte de portée Client doit être rattaché à une organisation.',
      });
    }
  }

  async list(params: {
    cursor?: string;
    limit?: number;
    role?: string;
    organizationId?: string;
  }): Promise<CursorPage<UserPublicView>> {
    const limit = params.limit ?? 25;
    const decoded = decodeCursor(params.cursor);

    const qb = this.users.createQueryBuilder('u').where('u.deleted_at IS NULL');
    if (params.role) {
      qb.andWhere('u.role_id = :role', { role: params.role });
    }
    if (params.organizationId) {
      qb.andWhere('u.organization_id = :org', { org: params.organizationId });
    }
    if (decoded) {
      qb.andWhere('(u.created_at, u.id) < (:cursorCreatedAt, :cursorId)', {
        cursorCreatedAt: decoded.createdAt,
        cursorId: decoded.id,
      });
    }
    qb.orderBy('u.created_at', 'DESC')
      .addOrderBy('u.id', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];

    return {
      items: items.map((u) => this.toPublicView(u)),
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

  async findById(id: string): Promise<UserPublicView> {
    const u = await this.users.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    }
    return this.toPublicView(u);
  }

  async create(
    dto: CreateUserDto,
  ): Promise<{ user: UserPublicView; activationToken: string }> {
    await this.assertRoleAssignable(dto.roleId, dto.organizationId);

    const existing = await this.users
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email: dto.email })
      .andWhere('u.deleted_at IS NULL')
      .getOne();
    if (existing) {
      throw new ConflictException({ code: 'USER_EMAIL_TAKEN' });
    }

    // Mot de passe inutilisable jusqu'à activation — utilise un hash impossible
    // à reproduire ('!' n'est jamais le préfixe d'un hash bcrypt valide).
    const placeholderHash = '!' + generateOpaqueToken();

    const user = this.users.create({
      email: dto.email,
      passwordHash: placeholderHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      roleId: dto.roleId,
      organizationId: dto.organizationId ?? null,
      timeZone: dto.timeZone ?? 'Africa/Abidjan',
      isActive: false,
      emailStatus: 'VALID',
    });
    const saved = await this.users.save(user);

    const ttl = this.config.get<number>(
      'ACCOUNT_ACTIVATION_TTL_SECONDS',
      259_200,
    );
    const token = generateOpaqueToken();
    await this.activationTokens.insert({
      userId: saved.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttl * 1000),
    });

    return { user: this.toPublicView(saved), activationToken: token };
  }

  /** Mise à jour par l'utilisateur de son propre profil (champs non sensibles). */
  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserPublicView> {
    const u = await this.users.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    u.firstName = dto.firstName;
    u.lastName = dto.lastName;
    if (dto.phone !== undefined) u.phone = dto.phone.trim() || null;
    if (dto.timeZone !== undefined) u.timeZone = dto.timeZone;
    const saved = await this.users.save(u);
    return this.toPublicView(saved);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserPublicView> {
    const u = await this.users.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });

    if (
      dto.email !== undefined &&
      dto.email.toLowerCase() !== u.email.toLowerCase()
    ) {
      const clash = await this.users
        .createQueryBuilder('u2')
        .where('LOWER(u2.email) = LOWER(:email)', { email: dto.email })
        .andWhere('u2.id <> :id', { id: u.id })
        .andWhere('u2.deleted_at IS NULL')
        .getOne();
      if (clash) throw new ConflictException({ code: 'USER_EMAIL_TAKEN' });
      u.email = dto.email;
      u.emailStatus = 'VALID';
    }
    if (dto.firstName !== undefined) u.firstName = dto.firstName;
    if (dto.lastName !== undefined) u.lastName = dto.lastName;
    if (dto.phone !== undefined) u.phone = dto.phone;
    if (dto.timeZone !== undefined) u.timeZone = dto.timeZone;
    if (dto.roleId !== undefined) {
      await this.assertRoleAssignable(
        dto.roleId,
        dto.organizationId ?? u.organizationId,
      );
      u.roleId = dto.roleId;
    }
    if (dto.organizationId !== undefined)
      u.organizationId = dto.organizationId ?? null;

    const saved = await this.users.save(u);
    return this.toPublicView(saved);
  }

  async deactivate(id: string): Promise<void> {
    const u = await this.users.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    u.isActive = false;
    await this.users.save(u);
    // Révoque toutes les sessions actives
    await this.sessions.update(
      { userId: id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async reactivate(id: string): Promise<void> {
    const u = await this.users.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    u.isActive = true;
    u.failedLoginCount = 0;
    u.lockedUntil = null;
    await this.users.save(u);
  }

  /**
   * Suppression logique (soft-delete) d'un utilisateur : pose `deleted_at`,
   * révoque ses sessions et libère son e-mail (les requêtes filtrent
   * `deleted_at IS NULL`). Garde-fous : pas d'auto-suppression, ni suppression
   * du dernier administrateur actif.
   */
  async softDelete(id: string, actorId: string): Promise<void> {
    if (id === actorId) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_SELF',
        message: 'Vous ne pouvez pas supprimer votre propre compte.',
      });
    }
    const u = await this.users.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });

    if (u.roleId === 'ADMIN') {
      const remainingAdmins = await this.users.count({
        where: { roleId: 'ADMIN', isActive: true, deletedAt: IsNull() },
      });
      if (remainingAdmins <= 1) {
        throw new BadRequestException({
          code: 'CANNOT_DELETE_LAST_ADMIN',
          message: 'Impossible de supprimer le dernier administrateur actif.',
        });
      }
    }

    await this.sessions.update(
      { userId: id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    await this.users.softRemove(u);
  }

  /**
   * Force l'envoi d'un courriel de réinitialisation (CDC §9.6.1 [EXG-09-…]).
   * Le service Auth produit le token via le même mécanisme que la demande
   * publique. On le réutilise pour préserver l'unicité de la logique.
   */
  async requestPasswordReset(id: string): Promise<{ token: string }> {
    const u = await this.users.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });

    const ttl = this.config.get<number>('PASSWORD_RESET_TTL_SECONDS', 1800);
    const token = generateOpaqueToken();
    await this.passwordResetTokens.insert({
      userId: u.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttl * 1000),
    });
    return { token };
  }

  private toPublicView(u: User): UserPublicView {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      roleId: u.roleId,
      organizationId: u.organizationId,
      phone: u.phone,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      timeZone: u.timeZone,
      createdAt: u.createdAt,
    };
  }
}
