/** Domaine « Produits » côté admin (catalogue, CDC §8.4.8). */
export interface ProductRow {
  id: string;
  code: string;
  label: string;
  description: string | null;
  defaultOwnerTeam: string | null;
  requiresOs: boolean;
  requiresBrowser: boolean;
  isActive: boolean;
}

export interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

/** Filtre/tri en mémoire (recherche code/label + statut), aligné sur les autres listes. */
export function filterProducts(
  items: ProductRow[],
  opts: { status?: 'ALL' | 'active' | 'inactive'; query?: string },
): ProductRow[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  return items
    .filter((p) => {
      if (opts.status === 'active' && !p.isActive) return false;
      if (opts.status === 'inactive' && p.isActive) return false;
      if (q && !`${p.code} ${p.label}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}
