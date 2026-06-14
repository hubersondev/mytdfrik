import 'server-only';
import { apiFetchOr } from './api';
import type { AssigneeOption, CursorPage } from './organizations';
import { fetchRoleOptions } from './role-options';
import type { UserRow } from './users';

/** Rôles internes éligibles comme responsable par défaut d'une organisation. */
const ASSIGNEE_ROLE_IDS = new Set(['ADMIN', 'RESPONSABLE']);

/**
 * Charge les responsables éligibles (utilisateurs actifs de rôle ADMIN ou
 * RESPONSABLE) pour le sélecteur « responsable par défaut » d'une organisation.
 */
export async function fetchAssigneeOptions(): Promise<AssigneeOption[]> {
  const emptyPage: CursorPage<UserRow> = {
    items: [],
    page_info: { has_next: false, next_cursor: null },
  };
  const [usersPage, roles] = await Promise.all([
    apiFetchOr<CursorPage<UserRow>>('/users?limit=100', emptyPage),
    fetchRoleOptions(),
  ]);
  const roleLabel = new Map(roles.map((r) => [r.id, r.label]));

  return usersPage.items
    .filter((u) => u.isActive && ASSIGNEE_ROLE_IDS.has(u.roleId))
    .map((u) => ({
      id: u.id,
      label: `${u.firstName} ${u.lastName} — ${roleLabel.get(u.roleId) ?? u.roleId}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}
