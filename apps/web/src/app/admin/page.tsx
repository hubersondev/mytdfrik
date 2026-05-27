import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface PageInfo {
  next_cursor: string | null;
  has_next: boolean;
}
interface CursorPage<T> {
  items: T[];
  page_info: PageInfo;
}

interface CategoryRow {
  id: string;
  code: string;
  isActive: boolean;
}
interface ProductRow {
  id: string;
  code: string;
  isActive: boolean;
}
interface UserRow {
  id: string;
  email: string;
  roleId: string;
  isActive: boolean;
}
interface PriorityLevelRow {
  id: string;
  label: string;
}

export default async function AdminDashboard() {
  const [categories, products, users, priorities] = await Promise.all([
    apiFetch<CursorPage<CategoryRow>>('/categories?limit=100').catch(() => ({
      items: [],
      page_info: { has_next: false, next_cursor: null },
    })),
    apiFetch<CursorPage<ProductRow>>('/products?limit=100').catch(() => ({
      items: [],
      page_info: { has_next: false, next_cursor: null },
    })),
    apiFetch<CursorPage<UserRow>>('/users?limit=100').catch(() => ({
      items: [],
      page_info: { has_next: false, next_cursor: null },
    })),
    apiFetch<PriorityLevelRow[]>('/priority-levels').catch(() => []),
  ]);

  const categoriesActive = categories.items.filter((c) => c.isActive).length;
  const productsActive = products.items.filter((p) => p.isActive).length;
  const usersActive = users.items.filter((u) => u.isActive).length;

  const tiles: Array<{
    label: string;
    total: number;
    activeLabel: string;
    activeCount: number;
    href: string;
  }> = [
    {
      label: 'Catégories',
      total: categories.items.length,
      activeLabel: 'actives',
      activeCount: categoriesActive,
      href: '/admin/categories',
    },
    {
      label: 'Produits',
      total: products.items.length,
      activeLabel: 'actifs',
      activeCount: productsActive,
      href: '/admin/categories',
    },
    {
      label: 'Utilisateurs',
      total: users.items.length,
      activeLabel: 'actifs',
      activeCount: usersActive,
      href: '/admin/categories',
    },
    {
      label: 'Niveaux de priorité',
      total: priorities.length,
      activeLabel: 'configurés',
      activeCount: priorities.length,
      href: '/admin/categories',
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Tableau de bord administrateur
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Aperçu du catalogue MyTDFRIK et des comptes utilisateurs.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {tile.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {tile.total}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              dont {tile.activeCount} {tile.activeLabel}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          État du Sprint 2
        </h2>
        <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>✓ 14 catégories du CDC annexe A3 seedées</li>
          <li>✓ 5 niveaux de priorité avec SLA paramétrables</li>
          <li>✓ CRUD catégories / produits / utilisateurs / organisations</li>
          <li>✓ RBAC appliqué : ADMIN requis pour les écritures</li>
        </ul>
      </div>
    </section>
  );
}
