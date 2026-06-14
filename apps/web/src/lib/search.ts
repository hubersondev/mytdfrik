/**
 * Types et helpers de la recherche globale (palette ⌘K).
 * Module neutre (ni `server-only` ni `use client`) : partagé entre la route
 * handler serveur et le composant client.
 */

export interface RequestHit {
  id: string;
  publicReference: string;
  title: string;
  status: string;
}

export interface UserHit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}

export interface CatalogHit {
  id: string;
  code: string;
  label: string;
}

export interface GlobalSearchResults {
  query: string;
  requests: RequestHit[];
  users: UserHit[];
  products: CatalogHit[];
  categories: CatalogHit[];
}

export type SearchEntity = 'request' | 'user' | 'product' | 'category';

/** Élément normalisé pour l'affichage et la navigation clavier. */
export interface SearchItem {
  key: string;
  entity: SearchEntity;
  title: string;
  subtitle: string;
  href: string;
}

export const GROUP_LABELS: Record<SearchEntity, string> = {
  request: 'Demandes',
  user: 'Utilisateurs',
  product: 'Produits',
  category: 'Catégories',
};

/**
 * Aplatit les résultats groupés en une liste ordonnée (demandes → utilisateurs
 * → produits → catégories) prête pour le rendu et la navigation au clavier.
 */
export function flattenResults(results: GlobalSearchResults): SearchItem[] {
  const items: SearchItem[] = [];

  for (const r of results.requests) {
    items.push({
      key: `request:${r.id}`,
      entity: 'request',
      title: r.title,
      subtitle: r.publicReference,
      href: `/admin/requests/${encodeURIComponent(r.publicReference)}`,
    });
  }
  for (const u of results.users) {
    items.push({
      key: `user:${u.id}`,
      entity: 'user',
      title: `${u.firstName} ${u.lastName}`.trim() || u.email,
      subtitle: u.email,
      href: `/admin/users?q=${encodeURIComponent(u.email)}`,
    });
  }
  for (const p of results.products) {
    items.push({
      key: `product:${p.id}`,
      entity: 'product',
      title: p.label,
      subtitle: p.code,
      href: `/admin/products?q=${encodeURIComponent(p.code)}`,
    });
  }
  for (const c of results.categories) {
    items.push({
      key: `category:${c.id}`,
      entity: 'category',
      title: c.label,
      subtitle: c.code,
      href: `/admin/categories?q=${encodeURIComponent(c.code)}`,
    });
  }

  return items;
}
