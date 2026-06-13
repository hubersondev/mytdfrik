'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Boxes, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProductAction, updateProductAction, type ProductFormFailure } from '../actions';
import { productFormSchema, type ProductFormInput } from '../schema';

interface Props {
  mode: 'create' | 'edit';
  productId?: string;
  defaultValues?: Partial<ProductFormInput>;
}

const FIELD_CLASS =
  'mt-1 flex w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500/30 focus-visible:border-leaf-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500';

export function ProductForm({ mode, productId, defaultValues }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    mode: 'onBlur',
    defaultValues: {
      code: defaultValues?.code ?? '',
      label: defaultValues?.label ?? '',
      description: defaultValues?.description ?? '',
      defaultOwnerTeam: defaultValues?.defaultOwnerTeam ?? '',
      requiresOs: defaultValues?.requiresOs ?? false,
      requiresBrowser: defaultValues?.requiresBrowser ?? false,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  function onSubmit(data: ProductFormInput) {
    setFormError(null);
    startSubmit(async () => {
      const result: ProductFormFailure | undefined =
        mode === 'create'
          ? await createProductAction(data)
          : await updateProductAction(productId as string, data);
      if (result && result.ok === false) {
        for (const [field, message] of Object.entries(result.fieldErrors) as Array<
          [keyof ProductFormInput, string]
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Code" error={form.formState.errors.code?.message}>
            <Input
              autoFocus={mode === 'create'}
              placeholder="TDFK_ONLINE"
              maxLength={40}
              disabled={mode === 'edit'}
              {...form.register('code')}
            />
          </Field>
          <Field label="Équipe par défaut" error={form.formState.errors.defaultOwnerTeam?.message}>
            <Input placeholder="Équipe Web" maxLength={80} {...form.register('defaultOwnerTeam')} />
          </Field>
        </div>

        <Field label="Libellé" error={form.formState.errors.label?.message}>
          <Input placeholder="Portail TDFK Online" maxLength={160} {...form.register('label')} />
        </Field>

        <Field label="Description" error={form.formState.errors.description?.message}>
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="Description du produit / service…"
            className={FIELD_CLASS}
            {...form.register('description')}
          />
        </Field>

        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
              {...form.register('requiresOs')}
            />
            Système d&apos;exploitation requis dans le formulaire de bug
          </label>
          <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
              {...form.register('requiresBrowser')}
            />
            Navigateur requis dans le formulaire de bug
          </label>
          <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
              {...form.register('isActive')}
            />
            Produit actif (proposé dans les formulaires de bug)
          </label>
        </div>
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
          <Link href="/admin/products">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : mode === 'create' ? (
            <>
              <Boxes className="h-4 w-4" />
              Créer le produit
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
    <div className="flex flex-col">
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
