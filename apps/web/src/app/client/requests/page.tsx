import { FileText, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { paginate, resolvePageSize } from '@/lib/paginate';
import { apiFetchOr } from '@/lib/api';
import { priorityLabel, statusLabel, statusVariant, type RequestSummary } from '@/lib/requests';
import { bucketKeyFromQuery, FILTER_BUCKETS } from '../_components/filter-buckets';
import { FilterMenu } from '../_components/filter-menu';
import { SortMenu } from '../_components/sort-menu';
import { DEFAULT_SORT, sortKeyFromQuery } from '../_components/sort-options';

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

export const metadata = {
  title: 'Mes demandes · MyTDFRIK',
};

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default async function ClientRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const bucket = bucketKeyFromQuery(params.status);
  const sort = sortKeyFromQuery(params.sort);
  const PAGE_SIZE = resolvePageSize(params.size);
  const qs = new URLSearchParams({ limit: '100' });
  if (params.status) qs.set('status', params.status);
  if (sort !== DEFAULT_SORT) qs.set('sort', sort);
  const page = await apiFetchOr<CursorPage<RequestSummary>>(`/requests?${qs.toString()}`, {
    items: [],
    page_info: { has_next: false, next_cursor: null },
  });
  const { pageItems, safePage } = paginate(page.items, Number(params.page) || 1, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
            <FileText className="h-3.5 w-3.5" />
            Mes demandes
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Suivi de vos demandes
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            {bucket === 'ALL'
              ? 'Retrouvez ici toutes les demandes soumises à TECHDIFRIK, leur statut et leur priorité.'
              : `Filtre actif : ${FILTER_BUCKETS[bucket].label.toLowerCase()}. ${page.items.length} résultat${page.items.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterMenu current={bucket} />
          <SortMenu current={sort} />
          <Button asChild>
            <Link href="/client/requests/new">
              <PlusCircle className="h-4 w-4" />
              Nouvelle demande
            </Link>
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <Th>Référence</Th>
                <Th>Titre</Th>
                <Th>Catégorie</Th>
                <Th>Statut</Th>
                <Th>Priorité</Th>
                <Th align="right">Soumise le</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {pageItems.map((r) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/client/requests/${r.publicReference}`}
                      className="font-mono text-xs text-leaf-700 hover:underline dark:text-leaf-400"
                    >
                      {r.publicReference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/client/requests/${r.publicReference}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {r.category?.label ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={priorityVariant(r.effectivePriorityId)}>
                      {priorityLabel(r.effectivePriorityId)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                    {dateFormatter.format(new Date(r.createdAt))}
                  </td>
                </tr>
              ))}
              {page.items.length === 0 && bucket === 'ALL' && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    <p>Vous n&apos;avez pas encore soumis de demande.</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link href="/client/requests/new">
                        <PlusCircle className="h-4 w-4" />
                        Créer ma première demande
                      </Link>
                    </Button>
                  </td>
                </tr>
              )}
              {page.items.length === 0 && bucket !== 'ALL' && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    <p>Aucune demande ne correspond à ce filtre.</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link href="/client/requests" scroll={false}>
                        Réinitialiser le filtre
                      </Link>
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} pageSize={PAGE_SIZE} total={page.items.length} />
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
