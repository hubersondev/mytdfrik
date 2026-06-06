import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Role, RolePermission } from '../database/entities';
import type { RoleScope } from '../database/entities';
import { ALL_PERMISSION_CODES } from './permissions.catalog';

export interface ResolvedAccess {
  scope: RoleScope;
  isSystem: boolean;
  permissions: string[];
}

/**
 * Résolution des droits effectifs d'un rôle (ADR-004).
 * Utilisé par la stratégie JWT (à chaque requête authentifiée) pour attacher
 * `scope` + `permissions` à `req.user`, et par le guard de permissions.
 */
@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
  ) {}

  /**
   * Retourne le scope et les permissions effectives d'un rôle.
   * Un rôle système (ADMIN) reçoit **toutes** les permissions du catalogue.
   * Retourne null si le rôle est introuvable, inactif ou supprimé.
   */
  async resolveAccess(roleId: string): Promise<ResolvedAccess | null> {
    const role = await this.roles.findOne({
      where: { id: roleId, deletedAt: IsNull() },
    });
    if (!role || !role.isActive) {
      return null;
    }

    if (role.isSystem) {
      return {
        scope: role.scope,
        isSystem: true,
        permissions: [...ALL_PERMISSION_CODES],
      };
    }

    const rows = await this.rolePermissions.find({ where: { roleId } });
    return {
      scope: role.scope,
      isSystem: false,
      permissions: rows.map((r) => r.permissionCode),
    };
  }

  /** Variante stricte : lève NotFoundException si le rôle n'est pas résoluble. */
  async resolveAccessOrThrow(roleId: string): Promise<ResolvedAccess> {
    const access = await this.resolveAccess(roleId);
    if (!access) {
      throw new NotFoundException({ code: 'ROLE_NOT_RESOLVABLE' });
    }
    return access;
  }
}
