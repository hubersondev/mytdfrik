import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '../../rbac/permissions.catalog';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restreint l'accès à une route aux utilisateurs disposant de **toutes** les
 * permissions listées (ET logique). L'ADMIN (rôle système) possède toutes les
 * permissions et passe donc systématiquement.
 *
 * Exemple : `@RequirePermissions('users.manage')`
 * À utiliser conjointement avec JwtAuthGuard + PermissionsGuard.
 */
export const RequirePermissions = (
  ...permissions: PermissionCode[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
