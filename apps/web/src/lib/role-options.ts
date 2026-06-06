import 'server-only';
import { apiFetchOr } from './api';
import type { RoleRow } from './roles';
import type { RoleOption } from './users';

/**
 * Charge les rôles attribuables (ADR-004) depuis l'API et les projette en
 * `RoleOption` pour les sélecteurs/filtres du domaine Utilisateurs.
 */
export async function fetchRoleOptions(): Promise<RoleOption[]> {
  const roles = await apiFetchOr<RoleRow[]>('/roles', []);
  return roles.map((r) => ({
    id: r.id,
    label: r.label,
    scope: r.scope,
    description: r.description,
    isActive: r.isActive,
  }));
}
