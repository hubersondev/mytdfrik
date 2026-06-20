'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, isNextRedirect } from '@/lib/api';
import type { RoleRow } from '@/lib/roles';
import { roleFormSchema, type RoleFormInput } from './schema';

export interface RoleFormFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof RoleFormInput, string>>;
  formError?: string;
}

function collectFieldErrors(
  issues: readonly { readonly path: PropertyKey[]; readonly message: string }[],
): RoleFormFailure['fieldErrors'] {
  const fieldErrors: RoleFormFailure['fieldErrors'] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key as keyof RoleFormInput] = issue.message;
    }
  }
  return fieldErrors;
}

function mapApiError(error: unknown): RoleFormFailure {
  if (isNextRedirect(error)) throw error;
  const apiError = error as { status?: number; code?: string; message?: string };
  if (apiError?.status === 409 && apiError?.code === 'ROLE_CODE_TAKEN') {
    return { ok: false, fieldErrors: { code: 'Ce code de rôle est déjà utilisé.' } };
  }
  if (apiError?.status === 400 && apiError?.code === 'UNKNOWN_PERMISSION') {
    return { ok: false, fieldErrors: { permissions: apiError.message ?? 'Permission inconnue.' } };
  }
  return {
    ok: false,
    fieldErrors: {},
    formError: apiError?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
  };
}

export async function createRoleAction(input: RoleFormInput): Promise<RoleFormFailure | never> {
  const parsed = roleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    await apiFetch<RoleRow>('/roles', {
      method: 'POST',
      body: JSON.stringify({
        code: parsed.data.code,
        label: parsed.data.label,
        description: parsed.data.description || undefined,
        scope: parsed.data.scope,
        isActive: parsed.data.isActive,
        permissions: parsed.data.permissions,
      }),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/roles');
  redirect('/admin/roles?created=1');
}

export async function updateRoleAction(
  id: string,
  input: RoleFormInput,
): Promise<RoleFormFailure | never> {
  const parsed = roleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    // code et scope sont immuables : non transmis à l'update.
    await apiFetch<RoleRow>(`/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        label: parsed.data.label,
        description: parsed.data.description || undefined,
        isActive: parsed.data.isActive,
        permissions: parsed.data.permissions,
      }),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/roles');
  redirect('/admin/roles?updated=1');
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function deleteRoleAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/roles/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la suppression.',
    };
  }
  revalidatePath('/admin/roles');
  return { ok: true };
}
