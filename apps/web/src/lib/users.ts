import type { BadgeProps } from '@/components/ui/badge';

/**
 * Domaine « Utilisateurs » côté front — types et helpers partagés entre la
 * liste admin, les formulaires et les Server Actions.
 *
 * Source de vérité API : `UserPublicView` (apps/api/src/users). Depuis l'ADR-004
 * les rôles sont **dynamiques** : ils sont chargés depuis `GET /roles` et passés
 * aux composants, plutôt que figés ici.
 */

export type RoleScope = 'INTERNAL' | 'CLIENT';

/** Rôle proposé dans les sélecteurs et filtres (sous-ensemble de RoleView). */
export interface RoleOption {
  id: string;
  label: string;
  scope: RoleScope;
  description?: string | null;
  isActive: boolean;
}

/** Couleur de badge associée à un rôle (socle connu, fallback neutre). */
export function roleVariant(roleId: string): NonNullable<BadgeProps['variant']> {
  switch (roleId) {
    case 'ADMIN':
      return 'brand';
    case 'DG':
      return 'sand';
    case 'GESTIONNAIRE':
      return 'leaf';
    case 'RESPONSABLE':
      return 'outline';
    default:
      return 'secondary';
  }
}

/** Vue publique d'un utilisateur telle que renvoyée par l'API. */
export interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationId: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  timeZone: string;
  createdAt: string;
}

/** Organisation (utilisée pour rattacher les comptes de portée Client). */
export interface OrganizationRow {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

// --------------------------------------------------------------------------
// Filtres & tri — résolus côté serveur depuis les searchParams (URL pure).
// --------------------------------------------------------------------------

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

/** Normalise le filtre rôle de l'URL : 'ALL' ou un code de rôle libre. */
export function roleKeyFromQuery(raw: string | undefined): string {
  return raw && raw.trim() ? raw : 'ALL';
}

export const SORT_OPTIONS = {
  created_desc: { label: 'Création (récent → ancien)', short: 'Plus récents' },
  created_asc: { label: 'Création (ancien → récent)', short: 'Plus anciens' },
  name_asc: { label: 'Nom (A → Z)', short: 'Nom A→Z' },
  last_login_desc: { label: 'Dernière connexion', short: 'Connexion' },
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const SORT_ORDER: SortKey[] = ['created_desc', 'created_asc', 'name_asc', 'last_login_desc'];
export const DEFAULT_SORT: SortKey = 'created_desc';

export function sortKeyFromQuery(raw: string | undefined): SortKey {
  return raw && raw in SORT_OPTIONS ? (raw as SortKey) : DEFAULT_SORT;
}

/** Applique le filtre statut + recherche texte + tri en mémoire. */
export function applyClientSideView(
  rows: UserRow[],
  opts: { status: StatusFilterKey; query: string; sort: SortKey },
): UserRow[] {
  const q = opts.query.trim().toLowerCase();
  let out = rows.filter((u) => {
    if (opts.status === 'ACTIVE' && !u.isActive) return false;
    if (opts.status === 'INACTIVE' && u.isActive) return false;
    if (q) {
      const haystack = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  out = [...out].sort((a, b) => {
    switch (opts.sort) {
      case 'created_asc':
        return a.createdAt.localeCompare(b.createdAt);
      case 'name_asc':
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr');
      case 'last_login_desc':
        return (b.lastLoginAt ?? '').localeCompare(a.lastLoginAt ?? '');
      case 'created_desc':
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });
  return out;
}
