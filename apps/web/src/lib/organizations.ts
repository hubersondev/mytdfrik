/**
 * Domaine « Organisations » côté front — types, libellés et helpers partagés
 * entre la liste admin, les formulaires et les Server Actions.
 *
 * Source de vérité API : entité `Organization` (apps/api/src/database/entities)
 * — réponse en camelCase. Une organisation regroupe les comptes CLIENT
 * (CDC §2.2.1, §8.4.1).
 */

/** Vue d'une organisation telle que renvoyée par l'API. */
export interface OrganizationRow {
  id: string;
  name: string;
  externalReference: string | null;
  addressLine: string | null;
  countryId: string | null;
  cityId: string | null;
  /** Relations jointes par l'API (liste / détail). */
  country: { id: string; code: string; name: string } | null;
  city: { id: string; name: string } | null;
  primaryContactEmail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  ACTIVE: { label: 'Actives' },
  INACTIVE: { label: 'Inactives' },
} as const;
export type StatusFilterKey = keyof typeof STATUS_FILTERS;
export const STATUS_ORDER: StatusFilterKey[] = ['ALL', 'ACTIVE', 'INACTIVE'];

export function statusKeyFromQuery(raw: string | undefined): StatusFilterKey {
  if (raw === 'ACTIVE' || raw === 'INACTIVE') return raw;
  return 'ALL';
}

export const SORT_OPTIONS = {
  created_desc: { label: 'Création (récent → ancien)', short: 'Plus récentes' },
  created_asc: { label: 'Création (ancien → récent)', short: 'Plus anciennes' },
  name_asc: { label: 'Nom (A → Z)', short: 'Nom A→Z' },
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const SORT_ORDER: SortKey[] = ['created_desc', 'created_asc', 'name_asc'];
export const DEFAULT_SORT: SortKey = 'created_desc';

export function sortKeyFromQuery(raw: string | undefined): SortKey {
  return raw && raw in SORT_OPTIONS ? (raw as SortKey) : DEFAULT_SORT;
}

/** Applique le filtre statut + recherche texte + tri en mémoire. */
export function applyClientSideView(
  rows: OrganizationRow[],
  opts: { status: StatusFilterKey; query: string; sort: SortKey },
): OrganizationRow[] {
  const q = opts.query.trim().toLowerCase();
  const out = rows.filter((o) => {
    if (opts.status === 'ACTIVE' && !o.isActive) return false;
    if (opts.status === 'INACTIVE' && o.isActive) return false;
    if (q) {
      const haystack =
        `${o.name} ${o.city?.name ?? ''} ${o.country?.name ?? ''} ${o.primaryContactEmail ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return [...out].sort((a, b) => {
    switch (opts.sort) {
      case 'created_asc':
        return a.createdAt.localeCompare(b.createdAt);
      case 'name_asc':
        return a.name.localeCompare(b.name, 'fr');
      case 'created_desc':
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });
}
