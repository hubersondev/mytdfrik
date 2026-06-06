'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrganizationRow, RoleOption } from '@/lib/users';
import { cn } from '@/lib/utils';
import { createUserAction, updateUserAction, type UserFormFailure } from '../actions';
import { userFormSchema, type UserFormInput } from '../schema';

interface Props {
  mode: 'create' | 'edit';
  organizations: OrganizationRow[];
  /** Rôles attribuables, chargés depuis l'API (ADR-004). */
  roles: RoleOption[];
  /** Identifiant requis en mode édition. */
  userId?: string;
  defaultValues?: Partial<UserFormInput>;
}

const FIELD_CLASS =
  'mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100';

export function UserForm({ mode, organizations, roles, userId, defaultValues }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      email: defaultValues?.email ?? '',
      roleId: defaultValues?.roleId ?? '',
      organizationId: defaultValues?.organizationId ?? '',
      phone: defaultValues?.phone ?? '',
      timeZone: defaultValues?.timeZone ?? 'Africa/Abidjan',
    },
  });

  const roleId = form.watch('roleId');
  const activeRoles = roles.filter((r) => r.isActive);
  const selectedRole = roles.find((r) => r.id === roleId);
  const requiresOrg = selectedRole?.scope === 'CLIENT';
  const activeOrgs = organizations.filter((o) => o.isActive);

  function onSubmit(data: UserFormInput) {
    setFormError(null);
    // Règle métier : un rôle de portée Client impose une organisation.
    if (requiresOrg && !data.organizationId) {
      form.setError('organizationId', {
        type: 'validate',
        message: 'Une organisation est obligatoire pour un rôle de portée Client.',
      });
      return;
    }
    startSubmit(async () => {
      const result: UserFormFailure | undefined =
        mode === 'create'
          ? await createUserAction(data)
          : await updateUserAction(userId as string, data);

      // En cas de succès, la Server Action redirige : on n'arrive ici qu'en erreur.
      if (result && result.ok === false) {
        for (const [field, message] of Object.entries(result.fieldErrors) as Array<
          [keyof UserFormInput, string]
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
          <Field label="Prénom" error={form.formState.errors.firstName?.message}>
            <Input autoFocus placeholder="Awa" maxLength={120} {...form.register('firstName')} />
          </Field>
          <Field label="Nom" error={form.formState.errors.lastName?.message}>
            <Input placeholder="Koné" maxLength={120} {...form.register('lastName')} />
          </Field>
        </div>

        <Field label="Adresse e-mail" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            placeholder="prenom.nom@entreprise.com"
            maxLength={254}
            {...form.register('email')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Rôle" error={form.formState.errors.roleId?.message}>
            <select className={FIELD_CLASS} {...form.register('roleId')}>
              <option value="" disabled>
                Sélectionnez un rôle…
              </option>
              {activeRoles.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} ({opt.scope === 'CLIENT' ? 'Client' : 'Interne'})
                </option>
              ))}
            </select>
            {selectedRole?.description && (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {selectedRole.description}
              </p>
            )}
          </Field>

          <Field
            label={requiresOrg ? 'Organisation (obligatoire)' : 'Organisation (optionnelle)'}
            error={form.formState.errors.organizationId?.message}
          >
            <select className={FIELD_CLASS} {...form.register('organizationId')}>
              <option value="">— Aucune —</option>
              {activeOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {requiresOrg && activeOrgs.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                Aucune organisation active. Créez-en une avant d&apos;ajouter ce compte.
              </p>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Téléphone (optionnel)" error={form.formState.errors.phone?.message}>
            <Input
              type="tel"
              placeholder="+225 07 00 00 00 00"
              maxLength={40}
              {...form.register('phone')}
            />
          </Field>
          <Field label="Fuseau horaire" error={form.formState.errors.timeZone?.message}>
            <Input placeholder="Africa/Abidjan" maxLength={64} {...form.register('timeZone')} />
          </Field>
        </div>

        {mode === 'create' && (
          <p className="rounded-md border border-leaf-200 bg-leaf-50/50 px-4 py-3 text-xs text-leaf-800 dark:border-leaf-900/60 dark:bg-leaf-950/30 dark:text-leaf-300">
            Le compte est créé <strong>inactif</strong>. Un e-mail d&apos;activation est envoyé à
            l&apos;utilisateur pour qu&apos;il définisse son mot de passe.
          </p>
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
          <Link href="/admin/users">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : mode === 'create' ? (
            <>
              <UserPlus className="h-4 w-4" />
              Créer l&apos;utilisateur
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
