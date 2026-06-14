import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { apiFetchOr } from '@/lib/api';
import { fetchAssigneeOptions } from '@/lib/assignee-options';
import type { CityRow, CountryRow, CursorPage } from '@/lib/geo';

import { OrganizationForm } from '../_components/organization-form';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export default async function NewOrganizationPage() {
  const [countries, cities, assignees] = await Promise.all([
    apiFetchOr<CursorPage<CountryRow>>(
      '/countries?limit=100&active_only=true',
      emptyPage<CountryRow>(),
    ),
    apiFetchOr<CursorPage<CityRow>>('/cities?limit=100', emptyPage<CityRow>()),
    fetchAssigneeOptions(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/organizations"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux organisations
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Nouvelle organisation
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Enregistrez une entreprise cliente avant d&apos;y rattacher des comptes.
            </p>
          </div>
        </div>
      </div>

      <OrganizationForm
        mode="create"
        countries={countries.items}
        cities={cities.items}
        assignees={assignees}
      />
    </div>
  );
}
