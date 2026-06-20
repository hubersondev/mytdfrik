'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, isNextRedirect } from '@/lib/api';
import type { OrganizationRow } from '@/lib/organizations';
import { organizationFormSchema, type OrganizationFormInput } from './schema';

export interface OrganizationFormFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof OrganizationFormInput, string>>;
  formError?: string;
}

/** Transforme les chaînes vides du formulaire en `undefined` pour l'API. */
function toPayload(data: OrganizationFormInput) {
  return {
    name: data.name,
    externalReference: data.externalReference ? data.externalReference : undefined,
    addressLine: data.addressLine ? data.addressLine : undefined,
    countryId: data.countryId ? data.countryId : undefined,
    cityId: data.cityId ? data.cityId : undefined,
    primaryContactEmail: data.primaryContactEmail ? data.primaryContactEmail : undefined,
    // `null` (et non `undefined`) pour permettre de retirer le responsable en édition.
    defaultAssigneeUserId: data.defaultAssigneeUserId ? data.defaultAssigneeUserId : null,
    isActive: data.isActive,
  };
}

function collectFieldErrors(
  issues: readonly { readonly path: PropertyKey[]; readonly message: string }[],
): OrganizationFormFailure['fieldErrors'] {
  const fieldErrors: OrganizationFormFailure['fieldErrors'] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key as keyof OrganizationFormInput] = issue.message;
    }
  }
  return fieldErrors;
}

function mapApiError(error: unknown): OrganizationFormFailure {
  if (isNextRedirect(error)) throw error;
  const apiError = error as { status?: number; code?: string; message?: string };
  if (apiError?.status === 409 && apiError?.code === 'ORGANIZATION_NAME_TAKEN') {
    return { ok: false, fieldErrors: { name: 'Une organisation porte déjà ce nom.' } };
  }
  return {
    ok: false,
    fieldErrors: {},
    formError: apiError?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
  };
}

/** Crée une organisation (POST /organizations). */
export async function createOrganizationAction(
  input: OrganizationFormInput,
): Promise<OrganizationFormFailure | never> {
  const parsed = organizationFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  try {
    await apiFetch<OrganizationRow>('/organizations', {
      method: 'POST',
      body: JSON.stringify(toPayload(parsed.data)),
    });
  } catch (error) {
    return mapApiError(error);
  }

  revalidatePath('/admin/organizations');
  redirect('/admin/organizations?created=1');
}

/** Met à jour une organisation (PATCH /organizations/:id). */
export async function updateOrganizationAction(
  id: string,
  input: OrganizationFormInput,
): Promise<OrganizationFormFailure | never> {
  const parsed = organizationFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  try {
    await apiFetch<OrganizationRow>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(toPayload(parsed.data)),
    });
  } catch (error) {
    return mapApiError(error);
  }

  revalidatePath('/admin/organizations');
  redirect('/admin/organizations?updated=1');
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

/** Désactive (soft-delete) une organisation (DELETE /organizations/:id). */
export async function deleteOrganizationAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/organizations/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la suppression.',
    };
  }
  revalidatePath('/admin/organizations');
  return { ok: true };
}
