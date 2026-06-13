import { ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';
import { CountryForm } from '../_components/country-form';

export default function NewCountryPage() {
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
            <Globe className="h-5 w-5" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nouveau pays
          </h1>
        </div>
      </div>

      <CountryForm mode="create" />
    </div>
  );
}
