'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Save, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  groupPermissions,
  permissionsForScope,
  SCOPE_LABELS,
  type PermissionDef,
  type RoleScope,
} from '@/lib/roles';
import { cn } from '@/lib/utils';
import { createRoleAction, updateRoleAction, type RoleFormFailure } from '../actions';
import { roleFormSchema, type RoleFormInput } from '../schema';

interface Props {
  mode: 'create' | 'edit';
  catalog: PermissionDef[];
  roleId?: string;
  /** En édition : un rôle système verrouille les permissions et le statut. */
  isSystem?: boolean;
  defaultValues?: Partial<RoleFormInput>;
}

const FIELD_CLASS =
  'mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-100';

export function RoleForm({ mode, catalog, roleId, isSystem = false, defaultValues }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<RoleFormInput>({
    resolver: zodResolver(roleFormSchema),
    mode: 'onBlur',
    defaultValues: {
      code: defaultValues?.code ?? '',
      label: defaultValues?.label ?? '',
      description: defaultValues?.description ?? '',
      scope: (defaultValues?.scope as RoleScope) ?? 'INTERNAL',
      isActive: defaultValues?.isActive ?? true,
      permissions: defaultValues?.permissions ?? [],
    },
  });

  const scope = form.watch('scope');
  const selected = form.watch('permissions');
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Permissions proposées selon le scope choisi, groupées pour l'affichage.
  const groups = useMemo(
    () => groupPermissions(permissionsForScope(catalog, scope)),
    [catalog, scope],
  );

  const togglePermission = (code: string, checked: boolean) => {
    const next = new Set(form.getValues('permissions'));
    if (checked) next.add(code);
    else next.delete(code);
    form.setValue('permissions', [...next], { shouldDirty: true });
  };

  const toggleGroup = (items: PermissionDef[], checked: boolean) => {
    const next = new Set(form.getValues('permissions'));
    for (const p of items) {
      if (checked) next.add(p.code);
      else next.delete(p.code);
    }
    form.setValue('permissions', [...next], { shouldDirty: true });
  };

  function onSubmit(data: RoleFormInput) {
    setFormError(null);
    startSubmit(async () => {
      const result: RoleFormFailure | undefined =
        mode === 'create'
          ? await createRoleAction(data)
          : await updateRoleAction(roleId as string, data);
      if (result && result.ok === false) {
        for (const [field, message] of Object.entries(result.fieldErrors) as Array<
          [keyof RoleFormInput, string]
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
              placeholder="SUPPORT_N1"
              maxLength={20}
              className="uppercase"
              disabled={mode === 'edit'}
              {...form.register('code')}
            />
            {mode === 'edit' && (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Le code est immuable après création.
              </p>
            )}
          </Field>
          <Field label="Portail" error={form.formState.errors.scope?.message}>
            <select className={FIELD_CLASS} disabled={mode === 'edit'} {...form.register('scope')}>
              <option value="INTERNAL">{SCOPE_LABELS.INTERNAL}</option>
              <option value="CLIENT">{SCOPE_LABELS.CLIENT}</option>
            </select>
            {mode === 'edit' && (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Le portail est immuable après création.
              </p>
            )}
          </Field>
        </div>

        <Field label="Libellé" error={form.formState.errors.label?.message}>
          <Input
            placeholder="Support Niveau 1"
            maxLength={80}
            autoFocus
            {...form.register('label')}
          />
        </Field>

        <Field label="Description (optionnelle)" error={form.formState.errors.description?.message}>
          <textarea
            rows={2}
            maxLength={2000}
            placeholder="Rôle dédié au premier niveau de support…"
            className="mt-1 flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
            {...form.register('description')}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            disabled={isSystem}
            className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 disabled:opacity-50 dark:border-zinc-700"
            {...form.register('isActive')}
          />
          Rôle actif
        </label>
      </Card>

      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-leaf-700 dark:text-leaf-400" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Permissions</h2>
        </div>

        {isSystem ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            Ce rôle système dispose de <strong>toutes les permissions</strong> et n&apos;est pas
            modifiable.
          </p>
        ) : (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Cochez les actions autorisées pour ce rôle. {selectedSet.size} permission
              {selectedSet.size > 1 ? 's' : ''} sélectionnée{selectedSet.size > 1 ? 's' : ''}.
            </p>
            <div className="flex flex-col gap-5">
              {groups.map(({ group, items }) => {
                const allChecked = items.every((p) => selectedSet.has(p.code));
                return (
                  <fieldset
                    key={group}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <legend className="flex items-center gap-2 px-1">
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) => toggleGroup(items, e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
                        />
                        {group}
                      </label>
                    </legend>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {items.map((p) => (
                        <label
                          key={p.code}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSet.has(p.code)}
                            onChange={(e) => togglePermission(p.code, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-leaf-700 focus:ring-leaf-500 dark:border-zinc-700"
                          />
                          <span>
                            <span className="text-zinc-900 dark:text-zinc-100">{p.label}</span>
                            <span className="block font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                              {p.code}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </>
        )}
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
          <Link href="/admin/roles">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Créer le rôle' : 'Enregistrer'}
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
