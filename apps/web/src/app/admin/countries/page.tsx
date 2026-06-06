import { CheckCircle2, Globe, Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetchOr } from '@/lib/api';
import {
  applyClientSideView,
  sortKeyFromQuery,
  statusKeyFromQuery,
  type CountryRow,
  type CursorPage,
} from '@/lib/geo';
import { CountryActionsMenu } from './_components/country-actions-menu';
import { CountriesToolbar } from './_components/countries-toolbar';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export default async function AdminCountriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    sort?: string;
    q?: string;
    created?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;
  const status = statusKeyFromQuery(params.status);
  const sort = sortKeyFromQuery(params.sort);
  const query = params.q ?? '';

  const page = await apiFetchOr<CursorPage<CountryRow>>(
    '/countries?limit=100',
    emptyPage<CountryRow>(),
  );

  const rows = applyClientSideView(page.items, {
    status,
    query,
    sort,
    extraHaystack: (c) => c.code,
  });
  const activeCount = page.items.filter((c) => c.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Configuration
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Pays
            </h1>
            <Badge variant="secondary">{page.items.length}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Référentiel des pays proposés lors de la localisation des organisations. {activeCount}{' '}
            actif{activeCount > 1 ? 's' : ''} sur {page.items.length}.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/countries/new">
            <Plus className="h-4 w-4" />
            Nouveau pays
          </Link>
        </Button>
      </header>

      {params.created && <SuccessBanner>Pays créé.</SuccessBanner>}
      {params.updated && <SuccessBanner>Modifications enregistrées.</SuccessBanner>}

      <CountriesToolbar status={status} sort={sort} query={query} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <Th>Code</Th>
                <Th>Pays</Th>
                <Th>Statut</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
                        <Globe className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <CountryActionsMenu countryId={c.id} name={c.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {page.items.length === 0
                      ? 'Aucun pays. Créez le premier.'
                      : 'Aucun pays ne correspond à ces filtres.'}
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

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
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
