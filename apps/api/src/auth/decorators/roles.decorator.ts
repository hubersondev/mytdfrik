import { SetMetadata } from '@nestjs/common';
import type { RoleCode } from '../../database/entities';

export const ROLES_KEY = 'roles';

/**
 * Restreint l'accès à une route ou un controller aux rôles listés (OR logique).
 * Exemple : `@Roles('GESTIONNAIRE', 'ADMIN')`
 *
 * À utiliser conjointement avec JwtAuthGuard + RolesGuard.
 */
export const Roles = (...roles: RoleCode[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
