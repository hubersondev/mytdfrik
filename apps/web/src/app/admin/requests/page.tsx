import { Inbox, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { apiFetchOr } from '@/lib/api';
import { priorityLabel, statusLabel, statusVariant, type RequestSummary } from '@/lib/requests';
import { bucketKeyFromQuery } from '../../client/_components/filter-buckets';
import { FilterMenu } from '../../client/_components/filter-menu';
import { SortMenu } from '../../client/_components/sort-menu';
import { DEFAULT_SORT, sortKeyFromQuery } from '../../client/_components/sort-options';

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; assignee?: string }>;
}) {
  const params = await searchParams;
  const bucket = bucketKeyFromQuery(params.status);
  const sort = sortKeyFromQuery(params.sort);
  const mine = params.assignee === 'me';

  const qs = new URLSearchParams({ limit: '100' });
  if (params.status) qs.set('status', params.status);
  if (sort !== DEFAULT_SORT) qs.set('sort', sort);
  if (mine) qs.set('assignee', 'me');

  const tabQuery = (assignee: boolean) => {
    const p = new URLSearchParams();
    if (params.status) p.set('status', params.status);
    if (params.sort) p.set('sort', params.sort);
    if (assignee) p.set('assignee', 'me');
    const s = p.toString();
    return s ? `/admin/requests?${s}` : '/admin/requests';
  };

  const page = await apiFetchOr<CursorPage<RequestSummary>>(`/requests?${qs.toString()}`, {
    items: [],
    page_info: { has_next: false, next_cursor: null },
  });

  const newCount = page.items.filter((r) => r.status === 'NOUVELLE').length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Traitement
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            File des demandes
          </h1>
          <Badge variant="secondary">{page.items.length}</Badge>
          {newCount > 0 && <Badge variant="brand">{newCount} à qualifier</Badge>}
        </div>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Qualifiez, affectez et suivez les demandes. Les boutons d&apos;action dépendent du statut
          de la demande et de vos permissions.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800">
          <Link
            href={tabQuery(false)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              !mine
                ? 'bg-leaf-700 text-white'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Toutes
          </Link>
          <Link
            href={tabQuery(true)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              mine
                ? 'bg-leaf-700 text-white'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Affectées à moi
          </Link>
        </div>
        <FilterMenu current={bucket} />
        <SortMenu current={sort} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <Th>Référence</Th>
                <Th>Titre</Th>
                <Th>Catégorie</Th>
                <Th>Priorité</Th>
                <Th>Statut</Th>
                <Th align="right">Soumise le</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {page.items.map((r) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/requests/${r.publicReference}`}
                      className="font-mono text-xs text-leaf-700 hover:underline dark:text-leaf-400"
                    >
                      {r.publicReference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/requests/${r.publicReference}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {r.category?.label ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={priorityVariant(r.effectivePriorityId)}>
                      {priorityLabel(r.effectivePriorityId)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                    {dateFmt.format(new Date(r.createdAt))}
                  </td>
                </tr>
              ))}
              {page.items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    <Inbox className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
                    Aucune demande pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
