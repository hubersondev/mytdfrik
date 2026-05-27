import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleCode } from '../../database/entities';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  const buildContext = (
    user: { roleId: RoleCode } | undefined,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('autorise si aucun rôle requis (route non décorée)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(buildContext({ roleId: 'CLIENT' }))).toBe(true);
  });

  it('autorise si le rôle utilisateur figure dans la liste', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['GESTIONNAIRE', 'ADMIN']);
    expect(guard.canActivate(buildContext({ roleId: 'GESTIONNAIRE' }))).toBe(
      true,
    );
  });

  it('refuse si le rôle utilisateur ne figure pas dans la liste', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(buildContext({ roleId: 'CLIENT' }))).toThrow(
      ForbiddenException,
    );
  });

  it('refuse si aucun utilisateur dans la requête', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  // Matrice de droits CDC §2.3 — quelques sondes représentatives
  describe('matrice de droits CDC §2.3', () => {
    const cases: Array<{
      role: RoleCode;
      required: RoleCode[];
      expected: boolean;
    }> = [
      { role: 'CLIENT', required: ['CLIENT'], expected: true },
      { role: 'CLIENT', required: ['GESTIONNAIRE'], expected: false },
      { role: 'GESTIONNAIRE', required: ['GESTIONNAIRE'], expected: true },
      {
        role: 'RESPONSABLE',
        required: ['GESTIONNAIRE', 'RESPONSABLE'],
        expected: true,
      },
      { role: 'ADMIN', required: ['ADMIN'], expected: true },
      { role: 'DG', required: ['DG', 'ADMIN'], expected: true },
      {
        role: 'DG',
        required: ['CLIENT', 'GESTIONNAIRE', 'RESPONSABLE'],
        expected: false,
      },
    ];

    it.each(cases)(
      'rôle $role contre exigence $required → $expected',
      ({ role, required, expected }) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);
        if (expected) {
          expect(guard.canActivate(buildContext({ roleId: role }))).toBe(true);
        } else {
          expect(() =>
            guard.canActivate(buildContext({ roleId: role })),
          ).toThrow(ForbiddenException);
        }
      },
    );
  });
});
