import { ArrowLeft, Building } from 'lucide-react';
import Link from 'next/link';
import { apiFetchOr } from '@/lib/api';
import type { CountryRow, CursorPage } from '@/lib/geo';
import { CityForm } from '../_components/city-form';

function emptyPage<T>(): CursorPage<T> {
  return { items: [], page_info: { has_next: false, next_cursor: null } };
}

export default async function NewCityPage() {
  const countries = await apiFetchOr<CursorPage<CountryRow>>(
    '/countries?limit=100&active_only=true',
    emptyPage<CountryRow>(),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/cities"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux villes
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Building className="h-5 w-5" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nouvelle ville
          </h1>
        </div>
      </div>

      <CityForm mode="create" countries={countries.items} />
    </div>
  );
}
