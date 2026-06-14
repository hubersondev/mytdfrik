import { isEligibleDefaultAssignee } from './organizations.service';

/**
 * Règle d'éligibilité du responsable par défaut d'une organisation : un
 * utilisateur actif, de portail interne, de rôle ADMIN ou RESPONSABLE.
 */
describe('isEligibleDefaultAssignee', () => {
  const base = {
    isActive: true,
    roleId: 'RESPONSABLE',
    role: { scope: 'INTERNAL' },
  };

  it('accepte un RESPONSABLE interne actif', () => {
    expect(isEligibleDefaultAssignee(base)).toBe(true);
  });

  it('accepte un ADMIN interne actif', () => {
    expect(isEligibleDefaultAssignee({ ...base, roleId: 'ADMIN' })).toBe(true);
  });

  it('refuse un GESTIONNAIRE (rôle non éligible)', () => {
    expect(isEligibleDefaultAssignee({ ...base, roleId: 'GESTIONNAIRE' })).toBe(
      false,
    );
  });

  it('refuse un DG (rôle non éligible)', () => {
    expect(isEligibleDefaultAssignee({ ...base, roleId: 'DG' })).toBe(false);
  });

  it('refuse un CLIENT (portail non interne)', () => {
    expect(
      isEligibleDefaultAssignee({
        isActive: true,
        roleId: 'CLIENT',
        role: { scope: 'CLIENT' },
      }),
    ).toBe(false);
  });

  it('refuse un utilisateur inactif même éligible par rôle', () => {
    expect(isEligibleDefaultAssignee({ ...base, isActive: false })).toBe(false);
  });

  it('refuse un utilisateur sans rôle chargé', () => {
    expect(
      isEligibleDefaultAssignee({
        isActive: true,
        roleId: 'ADMIN',
        role: null,
      }),
    ).toBe(false);
  });
});
