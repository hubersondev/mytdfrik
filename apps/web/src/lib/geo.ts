/**
 * Domaine « Géographie » côté front — types, helpers de filtre/tri partagés
 * entre les listes admin (pays / villes), les formulaires et les Server Actions.
 *
 * Source de vérité API : entités `Country` et `City` (apps/api/src/geo) —
 * réponses en camelCase. `country.code` suit ISO 3166-1 alpha-2.
 */

export interface CountryRow {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CityRow {
  id: string;
  countryId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Présent quand l'API joint le pays (liste / détail). */
  country?: { id: string; code: string; name: string } | null;
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

export const SORT_OPTIONS = {
  name_asc: { label: 'Nom (A → Z)', short: 'Nom A→Z' },
  created_desc: { label: 'Création (récent → ancien)', short: 'Plus récents' },
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const SORT_ORDER: SortKey[] = ['name_asc', 'created_desc'];
export const DEFAULT_SORT: SortKey = 'name_asc';

export function sortKeyFromQuery(raw: string | undefined): SortKey {
  return raw && raw in SORT_OPTIONS ? (raw as SortKey) : DEFAULT_SORT;
}

interface BaseGeoRow {
  name: string;
  isActive: boolean;
  createdAt: string;
}

/** Applique le filtre statut + recherche texte + tri en mémoire. */
export function applyClientSideView<T extends BaseGeoRow>(
  rows: T[],
  opts: {
    status: StatusFilterKey;
    query: string;
    sort: SortKey;
    extraHaystack?: (row: T) => string;
  },
): T[] {
  const q = opts.query.trim().toLowerCase();
  const out = rows.filter((r) => {
    if (opts.status === 'ACTIVE' && !r.isActive) return false;
    if (opts.status === 'INACTIVE' && r.isActive) return false;
    if (q) {
      const haystack = `${r.name} ${opts.extraHaystack?.(r) ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return [...out].sort((a, b) => {
    switch (opts.sort) {
      case 'created_desc':
        return b.createdAt.localeCompare(a.createdAt);
      case 'name_asc':
      default:
        return a.name.localeCompare(b.name, 'fr');
    }
  });
}
