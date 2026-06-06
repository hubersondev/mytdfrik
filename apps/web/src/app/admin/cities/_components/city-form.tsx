'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Building, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CountryRow } from '@/lib/geo';
import { cn } from '@/lib/utils';
import { createCityAction, updateCityAction, type CityFormFailure } from '../actions';
import { cityFormSchema, type CityFormInput } from '../schema';

interface Props {
  mode: 'create' | 'edit';
  countries: CountryRow[];
  cityId?: string;
  defaultValues?: Partial<CityFormInput>;
}

const FIELD_CLASS =
  'mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100';

export function CityForm({ mode, countries, cityId, defaultValues }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<CityFormInput>({
    resolver: zodResolver(cityFormSchema),
    mode: 'onBlur',
    defaultValues: {
      countryId: defaultValues?.countryId ?? '',
      name: defaultValues?.name ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const activeCountries = countries.filter((c) => c.isActive);

  function onSubmit(data: CityFormInput) {
    setFormError(null);
    startSubmit(async () => {
      const result: CityFormFailure | undefined =
        mode === 'create'
          ? await createCityAction(data)
          : await updateCityAction(cityId as string, data);
      if (result && result.ok === false) {
        for (const [field, message] of Object.entries(result.fieldErrors) as Array<
          [keyof CityFormInput, string]
        >) {
          form.setError(field, { type: 'server', message });
        }
        if (result.formError) setFormError(result.formError);
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      aria-busy={submitting}
    >
      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        <Field label="Pays" error={form.formState.errors.countryId?.message}>
          <select className={FIELD_CLASS} {...form.register('countryId')}>
            <option value="" disabled>
              Sélectionnez un pays…
            </option>
            {activeCountries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nom de la ville" error={form.formState.errors.name?.message}>
          <Input autoFocus placeholder="Abidjan" maxLength={120} {...form.register('name')} />
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
            {...form.register('isActive')}
          />
          Ville active (proposée dans les sélecteurs)
        </label>
      </Card>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button asChild type="button" variant="ghost" disabled={submitting}>
          <Link href="/admin/cities">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : mode === 'create' ? (
            <>
              <Building className="h-4 w-4" />
              Créer la ville
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col')}>
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
