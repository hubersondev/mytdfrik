/**
 * Découpage de pagination (serveur-safe). Le composant d'affichage
 * `Pagination` vit dans `@/components/ui/pagination` (client).
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { pageItems: T[]; safePage: number } {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  return { pageItems: items.slice(start, start + pageSize), safePage };
}

/** Tailles de page proposées à l'utilisateur. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Résout la taille de page depuis l'URL (`?size=`), bornée aux options. */
export function resolvePageSize(value: string | undefined): number {
  const n = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}
