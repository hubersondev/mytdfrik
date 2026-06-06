import { Building, CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetchOr } from '@/lib/api';
import {
  applyClientSideView,
  sortKeyFromQuery,
  statusKeyFromQuery,
  type CityRow,
  type CountryRow,
  type CursorPage,
} from '@/lib/geo';
import { CityActionsMenu } from './_components/city-actions-menu';
import { CitiesToolbar } from './_components/cities-toolbar';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export default async function AdminCitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    country_id?: string;
    status?: string;
    sort?: string;
    q?: string;
    created?: string;
    updated?: string;
  }>;
}) {
  const params = await searchParams;
  const countryId = params.country_id ?? 'ALL';
  const status = statusKeyFromQuery(params.status);
  const sort = sortKeyFromQuery(params.sort);
  const query = params.q ?? '';

  // Le filtre pays est délégué à l'API ; statut + recherche + tri sont appliqués
  // en mémoire (jeu de données borné à 100, cohérent avec le reste de l'admin).
  const qs = new URLSearchParams({ limit: '100' });
  if (countryId !== 'ALL') qs.set('country_id', countryId);

  const [citiesPage, countriesPage] = await Promise.all([
    apiFetchOr<CursorPage<CityRow>>(`/cities?${qs.toString()}`, emptyPage<CityRow>()),
    apiFetchOr<CursorPage<CountryRow>>('/countries?limit=100', emptyPage<CountryRow>()),
  ]);

  const rows = applyClientSideView(citiesPage.items, {
    status,
    query,
    sort,
    extraHaystack: (c) => c.country?.name ?? '',
  });
  const activeCount = citiesPage.items.filter((c) => c.isActive).length;

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
              Villes
            </h1>
            <Badge variant="secondary">{citiesPage.items.length}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Référentiel des villes proposées (dépendant du pays). {activeCount} active
            {activeCount > 1 ? 's' : ''} sur {citiesPage.items.length}
            {countryId !== 'ALL' ? ' pour ce pays' : ''}.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/cities/new">
            <Plus className="h-4 w-4" />
            Nouvelle ville
          </Link>
        </Button>
      </header>

      {params.created && <SuccessBanner>Ville créée.</SuccessBanner>}
      {params.updated && <SuccessBanner>Modifications enregistrées.</SuccessBanner>}

      <CitiesToolbar
        countries={countriesPage.items}
        countryId={countryId}
        status={status}
        sort={sort}
        query={query}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <Th>Ville</Th>
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
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
                        <Building className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.country?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <CityActionsMenu cityId={c.id} name={c.name} />
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
                    {citiesPage.items.length === 0
                      ? 'Aucune ville. Créez la première.'
                      : 'Aucune ville ne correspond à ces filtres.'}
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
