import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../auth.service';
import { PermissionsGuard } from './permissions.guard';

/**
 * Construit un ExecutionContext minimal portant un utilisateur donné.
 */
function contextWith(
  user: Partial<AuthenticatedUser> | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function reflectorReturning(required: string[] | undefined): Reflector {
  return { getAllAndOverride: () => required } as unknown as Reflector;
}

const baseUser = (permissions: string[]): Partial<AuthenticatedUser> => ({
  id: 'u1',
  roleId: 'GESTIONNAIRE',
  scope: 'INTERNAL',
  permissions,
});

describe('PermissionsGuard', () => {
  it('laisse passer une route sans @RequirePermissions', () => {
    const guard = new PermissionsGuard(reflectorReturning(undefined));
    expect(guard.canActivate(contextWith(baseUser([])))).toBe(true);
  });

  it('laisse passer quand toutes les permissions requises sont présentes', () => {
    const guard = new PermissionsGuard(reflectorReturning(['users.read']));
    expect(
      guard.canActivate(contextWith(baseUser(['users.read', 'users.manage']))),
    ).toBe(true);
  });

  it('exige TOUTES les permissions (ET logique)', () => {
    const guard = new PermissionsGuard(
      reflectorReturning(['users.read', 'users.manage']),
    );
    expect(() =>
      guard.canActivate(contextWith(baseUser(['users.read']))),
    ).toThrow(ForbiddenException);
  });

  it('refuse quand la permission manque', () => {
    const guard = new PermissionsGuard(reflectorReturning(['roles.manage']));
    expect(() =>
      guard.canActivate(contextWith(baseUser(['users.read']))),
    ).toThrow(ForbiddenException);
  });

  it('refuse un utilisateur absent', () => {
    const guard = new PermissionsGuard(reflectorReturning(['users.read']));
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it("autorise l'ADMIN (catalogue complet injecté dans permissions)", () => {
    const guard = new PermissionsGuard(reflectorReturning(['roles.manage']));
    const admin = {
      ...baseUser(['roles.manage', 'users.manage', 'audit.read']),
      roleId: 'ADMIN',
    };
    expect(guard.canActivate(contextWith(admin))).toBe(true);
  });
});
