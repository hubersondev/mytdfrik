import { Bug, Inbox } from 'lucide-react';
import Link from 'next/link';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { StatCard } from '@/components/ui/stat-card';
import { apiFetchOr } from '@/lib/api';
import { paginate, resolvePageSize } from '@/lib/paginate';
import {
  priorityLabel,
  statusLabel,
  statusVariant,
  type CategoryOption,
  type RequestSummary,
} from '@/lib/requests';

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export const metadata = { title: 'Bugs · MyTDFRIK' };

export default async function AdminBugsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const params = await searchParams;
  const PAGE_SIZE = resolvePageSize(params.size);

  const [catPage, reqPage] = await Promise.all([
    apiFetchOr<CursorPage<CategoryOption>>('/categories?limit=100', emptyPage<CategoryOption>()),
    apiFetchOr<CursorPage<RequestSummary>>('/requests?limit=100', emptyPage<RequestSummary>()),
  ]);

  const bugCategoryIds = new Set(
    catPage.items.filter((c) => c.requiresBugDetails).map((c) => c.id),
  );
  const bugs = reqPage.items.filter((r) => r.category && bugCategoryIds.has(r.category.id));
  const { pageItems, safePage } = paginate(bugs, Number(params.page) || 1, PAGE_SIZE);

  const openCount = bugs.filter((r) =>
    ['NOUVELLE', 'EN_ATTENTE_AFFECTATION', 'AFFECTEE', 'EN_COURS', 'EN_ATTENTE_CLIENT'].includes(
      r.status,
    ),
  ).length;
  const inProgressCount = bugs.filter((r) => r.status === 'EN_COURS').length;
  const closedCount = bugs.filter((r) => r.status === 'CLOTUREE').length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
          <Bug className="h-3.5 w-3.5" />
          Traitement
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Bugs signalés
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Les demandes des catégories de type bug, avec leur formulaire structuré et leur
          diagnostic. Ouvrez une demande pour consigner la reproduction et proposer une résolution.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={bugs.length} label="Total bugs" />
        <StatCard value={openCount} label="Ouverts" tone="amber" />
        <StatCard value={inProgressCount} label="En cours" tone="leaf" />
        <StatCard value={closedCount} label="Clôturés" tone="zinc" />
      </section>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <Th>Référence</Th>
                <Th>Titre</Th>
                <Th>Catégorie</Th>
                <Th>Priorité</Th>
                <Th>Statut</Th>
                <Th align="right">Soumise le</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
              {pageItems.map((r) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
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
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {dateFmt.format(new Date(r.createdAt))}
                  </td>
                </tr>
              ))}
              {bugs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    <Inbox className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
                    Aucun bug signalé pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} pageSize={PAGE_SIZE} total={bugs.length} />
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
