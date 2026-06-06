'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Building2, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CityRow, CountryRow } from '@/lib/geo';
import { cn } from '@/lib/utils';
import {
  createOrganizationAction,
  updateOrganizationAction,
  type OrganizationFormFailure,
} from '../actions';
import { organizationFormSchema, type OrganizationFormInput } from '../schema';

interface Props {
  mode: 'create' | 'edit';
  /** Référentiels chargés côté serveur et passés au formulaire. */
  countries: CountryRow[];
  cities: CityRow[];
  /** Identifiant requis en mode édition. */
  organizationId?: string;
  defaultValues?: Partial<OrganizationFormInput>;
}

const FIELD_CLASS =
  'mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100';

export function OrganizationForm({
  mode,
  countries,
  cities,
  organizationId,
  defaultValues,
}: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<OrganizationFormInput>({
    resolver: zodResolver(organizationFormSchema),
    mode: 'onBlur',
    defaultValues: {
      name: defaultValues?.name ?? '',
      externalReference: defaultValues?.externalReference ?? '',
      addressLine: defaultValues?.addressLine ?? '',
      countryId: defaultValues?.countryId ?? '',
      cityId: defaultValues?.cityId ?? '',
      primaryContactEmail: defaultValues?.primaryContactEmail ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const activeCountries = countries.filter((c) => c.isActive);
  const selectedCountryId = form.watch('countryId');
  // Villes proposées : celles du pays sélectionné, actives uniquement.
  const citiesForCountry = selectedCountryId
    ? cities.filter((c) => c.countryId === selectedCountryId && c.isActive)
    : [];

  function onSubmit(data: OrganizationFormInput) {
    setFormError(null);
    startSubmit(async () => {
      const result: OrganizationFormFailure | undefined =
        mode === 'create'
          ? await createOrganizationAction(data)
          : await updateOrganizationAction(organizationId as string, data);

      // En cas de succès, la Server Action redirige : on n'arrive ici qu'en erreur.
      if (result && result.ok === false) {
        for (const [field, message] of Object.entries(result.fieldErrors) as Array<
          [keyof OrganizationFormInput, string]
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
        <Field label="Nom de l'organisation" error={form.formState.errors.name?.message}>
          <Input
            autoFocus
            placeholder="ACME Côte d'Ivoire"
            maxLength={200}
            {...form.register('name')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Référence externe (optionnelle)"
            error={form.formState.errors.externalReference?.message}
          >
            <Input
              placeholder="Code client, n° SIREN…"
              maxLength={80}
              {...form.register('externalReference')}
            />
          </Field>
          <Field
            label="E-mail de contact principal (optionnel)"
            error={form.formState.errors.primaryContactEmail?.message}
          >
            <Input
              type="email"
              placeholder="contact@entreprise.com"
              maxLength={254}
              {...form.register('primaryContactEmail')}
            />
          </Field>
        </div>

        <Field label="Adresse (optionnelle)" error={form.formState.errors.addressLine?.message}>
          <Input
            placeholder="Rue, immeuble, étage…"
            maxLength={200}
            {...form.register('addressLine')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Pays (optionnel)" error={form.formState.errors.countryId?.message}>
            <select
              className={FIELD_CLASS}
              {...form.register('countryId', {
                // Changer de pays invalide la ville précédemment choisie.
                onChange: () => form.setValue('cityId', '', { shouldValidate: true }),
              })}
            >
              <option value="">— Aucun —</option>
              {activeCountries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ville (optionnelle)" error={form.formState.errors.cityId?.message}>
            <select
              className={FIELD_CLASS}
              disabled={!selectedCountryId}
              {...form.register('cityId')}
            >
              <option value="">
                {selectedCountryId ? '— Aucune —' : 'Choisissez d’abord un pays'}
              </option>
              {citiesForCountry.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {selectedCountryId && citiesForCountry.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                Aucune ville active pour ce pays. Ajoutez-en une dans Villes.
              </p>
            )}
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
            {...form.register('isActive')}
          />
          Organisation active (peut recevoir de nouveaux comptes Client)
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
          <Link href="/admin/organizations">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : mode === 'create' ? (
            <>
              <Building2 className="h-4 w-4" />
              Créer l&apos;organisation
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
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
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
