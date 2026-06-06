/**
 * Domaine « Rôles & permissions » côté front (ADR-004) — types et helpers
 * partagés entre la liste admin, le formulaire d'attribution et les actions.
 *
 * Source de vérité API : `RoleView` (apps/api/src/rbac) et le catalogue de
 * permissions (`GET /permissions`).
 */

export type RoleScope = 'INTERNAL' | 'CLIENT';

export interface RoleRow {
  id: string;
  label: string;
  description: string | null;
  scope: RoleScope;
  isSystem: boolean;
  isActive: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionDef {
  code: string;
  label: string;
  group: string;
  scope: RoleScope | null;
}

export const SCOPE_LABELS: Record<RoleScope, string> = {
  INTERNAL: 'Interne (portail Admin)',
  CLIENT: 'Client (portail Client)',
};

export const SCOPE_SHORT: Record<RoleScope, string> = {
  INTERNAL: 'Interne',
  CLIENT: 'Client',
};

/**
 * Permissions proposables pour un scope de rôle donné : on retient celles
 * marquées pour ce scope ou neutres (scope null).
 */
export function permissionsForScope(catalog: PermissionDef[], scope: RoleScope): PermissionDef[] {
  return catalog.filter((p) => p.scope === null || p.scope === scope);
}

/** Regroupe un catalogue de permissions par `group`, en conservant l'ordre. */
export function groupPermissions(catalog: PermissionDef[]): Array<{
  group: string;
  items: PermissionDef[];
}> {
  const order: string[] = [];
  const byGroup = new Map<string, PermissionDef[]>();
  for (const p of catalog) {
    if (!byGroup.has(p.group)) {
      byGroup.set(p.group, []);
      order.push(p.group);
    }
    byGroup.get(p.group)!.push(p);
  }
  return order.map((group) => ({ group, items: byGroup.get(group)! }));
}

// --------------------------------------------------------------------------
// Filtres & tri (URL pure, résolus côté serveur).
// --------------------------------------------------------------------------

export const SCOPE_FILTERS = {
  ALL: { label: 'Tous les portails' },
  INTERNAL: { label: 'Interne' },
  CLIENT: { label: 'Client' },
} as const;
export type ScopeFilterKey = keyof typeof SCOPE_FILTERS;
export const SCOPE_ORDER: ScopeFilterKey[] = ['ALL', 'INTERNAL', 'CLIENT'];

export function scopeKeyFromQuery(raw: string | undefined): ScopeFilterKey {
  if (raw === 'INTERNAL' || raw === 'CLIENT') return raw;
  return 'ALL';
}

export const STATUS_FILTERS = {
  ALL: { label: 'Tous les statuts' },
  ACTIVE: { label: 'Actifs' },
  INACTIVE: { label: 'Inactifs' },
} as const;
export type StatusFilterKey = keyof typeof STATUS_FILTERS;
export const STATUS_ORDER: StatusFilterKey[] = ['ALL', 'ACTIVE', 'INACTIVE'];

export function statusKeyFromQuery(raw: string | undefined): StatusFilterKey {
  if (raw === 'ACTIVE' || raw === 'INACTIVE') return raw;
  return 'ALL';
}

/** Filtre statut + recherche texte appliqués en mémoire (jeu de données borné). */
export function applyClientSideView(
  rows: RoleRow[],
  opts: { status: StatusFilterKey; query: string },
): RoleRow[] {
  const q = opts.query.trim().toLowerCase();
  return rows.filter((r) => {
    if (opts.status === 'ACTIVE' && !r.isActive) return false;
    if (opts.status === 'INACTIVE' && r.isActive) return false;
    if (q) {
      const haystack = `${r.id} ${r.label} ${r.description ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
