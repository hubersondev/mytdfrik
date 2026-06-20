'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, isNextRedirect } from '@/lib/api';
import type { UserRow } from '@/lib/users';
import { userFormSchema, type UserFormInput } from './schema';

export interface UserFormFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof UserFormInput, string>>;
  formError?: string;
}

/** Transforme les chaînes vides du formulaire en `undefined` pour l'API. */
function toPayload(data: UserFormInput) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    roleId: data.roleId,
    organizationId: data.organizationId ? data.organizationId : undefined,
    phone: data.phone ? data.phone : undefined,
    timeZone: data.timeZone ? data.timeZone : undefined,
  };
}

function collectFieldErrors(
  issues: readonly { readonly path: PropertyKey[]; readonly message: string }[],
): UserFormFailure['fieldErrors'] {
  const fieldErrors: UserFormFailure['fieldErrors'] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key as keyof UserFormInput] = issue.message;
    }
  }
  return fieldErrors;
}

function mapApiError(error: unknown): UserFormFailure {
  // Laisse passer la redirection de session expirée (401 → /api/auth/clear) :
  // sans cela, NEXT_REDIRECT serait affiché comme un faux message d'erreur.
  if (isNextRedirect(error)) throw error;
  const apiError = error as { status?: number; code?: string; message?: string };
  if (apiError?.status === 409 && apiError?.code === 'USER_EMAIL_TAKEN') {
    return { ok: false, fieldErrors: { email: 'Cette adresse e-mail est déjà utilisée.' } };
  }
  if (apiError?.status === 400 && apiError?.code === 'ORGANIZATION_REQUIRED') {
    return {
      ok: false,
      fieldErrors: { organizationId: 'Une organisation est obligatoire pour un Client.' },
    };
  }
  return {
    ok: false,
    fieldErrors: {},
    formError: apiError?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
  };
}

/**
 * Crée un utilisateur (POST /users). L'API émet un jeton d'activation et envoie
 * l'e-mail d'activation. En cas de succès, redirige vers la liste.
 */
export async function createUserAction(input: UserFormInput): Promise<UserFormFailure | never> {
  const parsed = userFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  try {
    await apiFetch<{ user: UserRow }>('/users', {
      method: 'POST',
      body: JSON.stringify(toPayload(parsed.data)),
    });
  } catch (error) {
    return mapApiError(error);
  }

  revalidatePath('/admin/users');
  redirect('/admin/users?created=1');
}

/** Met à jour un utilisateur (PATCH /users/:id). */
export async function updateUserAction(
  id: string,
  input: UserFormInput,
): Promise<UserFormFailure | never> {
  const parsed = userFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  try {
    await apiFetch<UserRow>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(toPayload(parsed.data)),
    });
  } catch (error) {
    return mapApiError(error);
  }

  revalidatePath('/admin/users');
  redirect('/admin/users?updated=1');
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

/** Désactive un compte et révoque ses sessions (POST /users/:id/deactivate). */
export async function deactivateUserAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/users/${id}/deactivate`, { method: 'POST' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la désactivation.',
    };
  }
  revalidatePath('/admin/users');
  return { ok: true };
}

/** Réactive un compte (POST /users/:id/reactivate). */
export async function reactivateUserAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/users/${id}/reactivate`, { method: 'POST' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la réactivation.',
    };
  }
  revalidatePath('/admin/users');
  return { ok: true };
}

/** Supprime (soft-delete) un utilisateur (DELETE /users/:id). */
export async function deleteUserAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const apiError = error as { code?: string; message?: string };
    if (apiError?.code === 'CANNOT_DELETE_SELF') {
      return { ok: false, message: 'Vous ne pouvez pas supprimer votre propre compte.' };
    }
    if (apiError?.code === 'CANNOT_DELETE_LAST_ADMIN') {
      return {
        ok: false,
        message: 'Impossible de supprimer le dernier administrateur actif.',
      };
    }
    return { ok: false, message: apiError?.message ?? 'Échec de la suppression.' };
  }
  revalidatePath('/admin/users');
  return { ok: true };
}

/** Émet un lien de réinitialisation de mot de passe (POST /users/:id/password-reset). */
export async function resetPasswordAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<{ sent: boolean }>(`/users/${id}/password-reset`, { method: 'POST' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? "Échec de l'envoi du lien.",
    };
  }
  return { ok: true, message: 'Lien de réinitialisation envoyé par e-mail.' };
}
