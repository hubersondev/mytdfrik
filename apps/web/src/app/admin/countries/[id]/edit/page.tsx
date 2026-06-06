import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { CountryRow } from '@/lib/geo';
import { CountryForm } from '../../_components/country-form';

export default async function EditCountryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let country: CountryRow;
  try {
    country = await apiFetch<CountryRow>(`/countries/${id}`);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/countries"
          className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux pays
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
            <Pencil className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {country.name}
            </h1>
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">{country.code}</p>
          </div>
        </div>
      </div>

      <CountryForm
        mode="edit"
        countryId={country.id}
        defaultValues={{
          code: country.code,
          name: country.name,
          isActive: country.isActive,
        }}
      />
    </div>
  );
}
