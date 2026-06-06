'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Globe, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createCountryAction, updateCountryAction, type CountryFormFailure } from '../actions';
import { countryFormSchema, type CountryFormInput } from '../schema';

interface Props {
  mode: 'create' | 'edit';
  countryId?: string;
  defaultValues?: Partial<CountryFormInput>;
}

export function CountryForm({ mode, countryId, defaultValues }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<CountryFormInput>({
    resolver: zodResolver(countryFormSchema),
    mode: 'onBlur',
    defaultValues: {
      code: defaultValues?.code ?? '',
      name: defaultValues?.name ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  function onSubmit(data: CountryFormInput) {
    setFormError(null);
    startSubmit(async () => {
      const result: CountryFormFailure | undefined =
        mode === 'create'
          ? await createCountryAction(data)
          : await updateCountryAction(countryId as string, data);
      if (result && result.ok === false) {
        for (const [field, message] of Object.entries(result.fieldErrors) as Array<
          [keyof CountryFormInput, string]
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[8rem_1fr]">
          <Field label="Code ISO" error={form.formState.errors.code?.message}>
            <Input
              autoFocus
              placeholder="CI"
              maxLength={2}
              className="uppercase"
              {...form.register('code')}
            />
          </Field>
          <Field label="Nom du pays" error={form.formState.errors.name?.message}>
            <Input placeholder="Côte d'Ivoire" maxLength={80} {...form.register('name')} />
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
            {...form.register('isActive')}
          />
          Pays actif (proposé dans les sélecteurs)
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
          <Link href="/admin/countries">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : mode === 'create' ? (
            <>
              <Globe className="h-4 w-4" />
              Créer le pays
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
