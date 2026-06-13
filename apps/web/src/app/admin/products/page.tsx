import { Boxes, CheckCircle2, Plus, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { RowActions } from '@/components/ui/row-actions';
import { StatCard } from '@/components/ui/stat-card';
import { StatusPill } from '@/components/ui/status-pill';
import { apiFetchOr } from '@/lib/api';
import { paginate, resolvePageSize } from '@/lib/paginate';
import { filterProducts, type CursorPage, type ProductRow } from '@/lib/products';
import { deleteProductAction } from './actions';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

type StatusKey = 'ALL' | 'active' | 'inactive';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    size?: string;
    created?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q ?? '';
  const status: StatusKey =
    params.status === 'active' || params.status === 'inactive' ? params.status : 'ALL';
  const PAGE_SIZE = resolvePageSize(params.size);

  const page = await apiFetchOr<CursorPage<ProductRow>>(
    '/products?limit=100',
    emptyPage<ProductRow>(),
  );
  const rows = filterProducts(page.items, { status, query });
  const { pageItems, safePage } = paginate(rows, Number(params.page) || 1, PAGE_SIZE);
  const total = page.items.length;
  const activeCount = page.items.filter((p) => p.isActive).length;

  const statusHref = (s: StatusKey) => {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    if (s !== 'ALL') sp.set('status', s);
    const qs = sp.toString();
    return qs ? `/admin/products?${qs}` : '/admin/products';
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Configuration
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Produits
        </h1>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard value={total} label="Produits" />
        <StatCard value={activeCount} label="Actifs" tone="leaf" />
        <StatCard value={total - activeCount} label="Inactifs" tone="zinc" />
      </section>

      {params.created && <SuccessBanner>Produit créé.</SuccessBanner>}
      {params.updated && <SuccessBanner>Modifications enregistrées.</SuccessBanner>}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/70 p-4 dark:border-zinc-800">
          <form action="/admin/products" className="relative flex-1 sm:max-w-xs">
            {status !== 'ALL' && <input type="hidden" name="status" value={status} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Rechercher (code, libellé)…"
              className="h-9 pl-9"
              aria-label="Rechercher un produit"
            />
          </form>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
            {(['ALL', 'active', 'inactive'] as StatusKey[]).map((s) => (
              <Link
                key={s}
                href={statusHref(s)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  status === s
                    ? 'bg-leaf-700 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {s === 'ALL' ? 'Tous' : s === 'active' ? 'Actifs' : 'Inactifs'}
              </Link>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <Th>Code</Th>
                <Th>Produit</Th>
                <Th>Équipe</Th>
                <Th>Champs requis</Th>
                <Th>Statut</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
              {pageItems.map((p) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {p.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
                        <Boxes className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.label}</p>
                        {p.description && (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.defaultOwnerTeam ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.requiresOs && <Badge variant="outline">OS</Badge>}
                      {p.requiresBrowser && <Badge variant="outline">Navigateur</Badge>}
                      {!p.requiresOs && !p.requiresBrowser && (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill active={p.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      editHref={`/admin/products/${p.id}/edit`}
                      label={p.label}
                      deleteAction={deleteProductAction}
                      deleteId={p.id}
                      deleteConfirm={`Désactiver le produit « ${p.label} » ?`}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {total === 0
                      ? 'Aucun produit. Créez le premier.'
                      : 'Aucun produit ne correspond à ces filtres.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} pageSize={PAGE_SIZE} total={rows.length} />
      </Card>
    </div>
  );
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th scope="col" className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}
