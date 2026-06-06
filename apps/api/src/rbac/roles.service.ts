import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Role, RolePermission, User } from '../database/entities';
import type { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { isValidPermissionCode } from './permissions.catalog';

export interface RoleView {
  id: string;
  label: string;
  description: string | null;
  scope: Role['scope'];
  isSystem: boolean;
  isActive: boolean;
  permissions: string[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async list(params: {
    scope?: string;
    activeOnly?: boolean;
  }): Promise<RoleView[]> {
    const qb = this.roles.createQueryBuilder('r').where('r.deleted_at IS NULL');
    if (params.scope) {
      qb.andWhere('r.scope = :scope', { scope: params.scope });
    }
    if (params.activeOnly) {
      qb.andWhere('r.is_active = :a', { a: true });
    }
    qb.orderBy('r.is_system', 'DESC').addOrderBy('r.label', 'ASC');
    const rows = await qb.getMany();
    return Promise.all(rows.map((r) => this.toView(r)));
  }

  async findById(id: string): Promise<RoleView> {
    const role = await this.roles.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!role) {
      throw new NotFoundException({ code: 'ROLE_NOT_FOUND' });
    }
    return this.toView(role);
  }

  async create(dto: CreateRoleDto): Promise<RoleView> {
    const code = dto.code.toUpperCase();
    const existing = await this.roles.findOne({ where: { id: code } });
    if (existing) {
      throw new ConflictException({
        code: 'ROLE_CODE_TAKEN',
        message: `Un rôle utilise déjà le code "${code}".`,
      });
    }
    const permissions = this.validatePermissions(dto.permissions ?? []);

    await this.dataSource.transaction(async (manager) => {
      const role = manager.getRepository(Role).create({
        id: code,
        label: dto.label,
        description: dto.description ?? null,
        scope: dto.scope,
        isSystem: false,
        isActive: dto.isActive ?? true,
      });
      await manager.getRepository(Role).save(role);
      if (permissions.length > 0) {
        await manager.getRepository(RolePermission).insert(
          permissions.map((permissionCode) => ({
            roleId: code,
            permissionCode,
          })),
        );
      }
    });

    return this.findById(code);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleView> {
    const role = await this.roles.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!role) {
      throw new NotFoundException({ code: 'ROLE_NOT_FOUND' });
    }
    // Un rôle système (ADMIN) garde toutes ses permissions et reste actif :
    // on n'autorise que la retouche de libellé / description.
    if (
      role.isSystem &&
      (dto.permissions !== undefined || dto.isActive === false)
    ) {
      throw new ForbiddenException({
        code: 'SYSTEM_ROLE_LOCKED',
        message:
          'Le rôle Administrateur ne peut pas être désactivé ni voir ses permissions modifiées.',
      });
    }

    const permissions =
      dto.permissions !== undefined
        ? this.validatePermissions(dto.permissions)
        : undefined;

    await this.dataSource.transaction(async (manager) => {
      if (dto.label !== undefined) role.label = dto.label;
      if (dto.description !== undefined) role.description = dto.description;
      if (dto.isActive !== undefined) role.isActive = dto.isActive;
      await manager.getRepository(Role).save(role);

      if (permissions !== undefined) {
        await manager.getRepository(RolePermission).delete({ roleId: id });
        if (permissions.length > 0) {
          await manager.getRepository(RolePermission).insert(
            permissions.map((permissionCode) => ({
              roleId: id,
              permissionCode,
            })),
          );
        }
      }
    });

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const role = await this.roles.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!role) {
      throw new NotFoundException({ code: 'ROLE_NOT_FOUND' });
    }
    if (role.isSystem) {
      throw new ForbiddenException({
        code: 'SYSTEM_ROLE_LOCKED',
        message: 'Le rôle Administrateur ne peut pas être supprimé.',
      });
    }
    const inUse = await this.users.count({
      where: { roleId: id, deletedAt: IsNull() },
    });
    if (inUse > 0) {
      throw new ConflictException({
        code: 'ROLE_IN_USE',
        message: `Ce rôle est attribué à ${inUse} utilisateur(s). Réaffectez-les avant de le supprimer.`,
      });
    }
    await this.rolePermissions.delete({ roleId: id });
    await this.roles.softRemove(role);
  }

  private validatePermissions(codes: string[]): string[] {
    const unique = [...new Set(codes)];
    const invalid = unique.filter((c) => !isValidPermissionCode(c));
    if (invalid.length > 0) {
      throw new BadRequestException({
        code: 'UNKNOWN_PERMISSION',
        message: `Permissions inconnues : ${invalid.join(', ')}.`,
      });
    }
    return unique;
  }

  private async toView(role: Role): Promise<RoleView> {
    const [perms, userCount] = await Promise.all([
      role.isSystem
        ? Promise.resolve<string[]>([])
        : this.rolePermissions
            .find({ where: { roleId: role.id } })
            .then((rows) => rows.map((r) => r.permissionCode)),
      this.users.count({ where: { roleId: role.id, deletedAt: IsNull() } }),
    ]);
    return {
      id: role.id,
      label: role.label,
      description: role.description,
      scope: role.scope,
      isSystem: role.isSystem,
      isActive: role.isActive,
      // Un rôle système possède tout le catalogue (représenté côté UI par un état dédié).
      permissions: perms,
      userCount,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
