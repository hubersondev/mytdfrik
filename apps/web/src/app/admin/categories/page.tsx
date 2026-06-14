import { Badge, priorityVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { paginate, resolvePageSize } from '@/lib/paginate';
import { apiFetch } from '@/lib/api';

interface CategoryRow {
  id: string;
  code: string;
  label: string;
  description: string | null;
  defaultPriorityId: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  requiresBugDetails: boolean;
  defaultResponsibleTeam: string | null;
  isActive: boolean;
}

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; q?: string }>;
}) {
  const params = await searchParams;
  const PAGE_SIZE = resolvePageSize(params.size);
  const query = (params.q ?? '').trim().toLowerCase();
  const page = await apiFetch<CursorPage<CategoryRow>>('/categories?limit=100');
  const filtered = query
    ? page.items.filter((c) =>
        `${c.code} ${c.label} ${c.description ?? ''}`.toLowerCase().includes(query),
      )
    : page.items;
  const items = [...filtered].sort((a, b) => {
    if (a.defaultPriorityId !== b.defaultPriorityId) {
      return a.defaultPriorityId.localeCompare(b.defaultPriorityId);
    }
    return a.code.localeCompare(b.code);
  });
  const { pageItems, safePage } = paginate(items, Number(params.page) || 1, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Catalogue de catégories
          </h1>
          <Badge variant="secondary">{page.items.length}</Badge>
        </div>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Catalogue éditable par l&apos;Administrateur (CDC §3.5, annexe A3). Le CRUD complet est
          disponible via l&apos;API ; les formulaires UI seront ajoutés au besoin dans les sprints
          suivants.
        </p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <Th>Code</Th>
                <Th>Libellé</Th>
                <Th>Priorité</Th>
                <Th>Bug structuré</Th>
                <Th>Équipe par défaut</Th>
                <Th align="right">Statut</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {pageItems.map((c) => (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {c.code}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                    <p className="font-medium">{c.label}</p>
                    {c.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={priorityVariant(c.defaultPriorityId)}>
                      {c.defaultPriorityId}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.requiresBugDetails ? <Badge variant="outline">Oui</Badge> : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.defaultResponsibleTeam ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    Aucune catégorie configurée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} pageSize={PAGE_SIZE} total={items.length} />
      </Card>
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
