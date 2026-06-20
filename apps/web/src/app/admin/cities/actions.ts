'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, isNextRedirect } from '@/lib/api';
import type { CityRow } from '@/lib/geo';
import { cityFormSchema, type CityFormInput } from './schema';

export interface CityFormFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof CityFormInput, string>>;
  formError?: string;
}

function collectFieldErrors(
  issues: readonly { readonly path: PropertyKey[]; readonly message: string }[],
): CityFormFailure['fieldErrors'] {
  const fieldErrors: CityFormFailure['fieldErrors'] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key as keyof CityFormInput] = issue.message;
    }
  }
  return fieldErrors;
}

function mapApiError(error: unknown): CityFormFailure {
  if (isNextRedirect(error)) throw error;
  const apiError = error as { status?: number; code?: string; message?: string };
  if (apiError?.status === 409 && apiError?.code === 'CITY_NAME_TAKEN') {
    return { ok: false, fieldErrors: { name: 'Cette ville existe déjà pour ce pays.' } };
  }
  if (apiError?.status === 404 && apiError?.code === 'COUNTRY_NOT_FOUND') {
    return { ok: false, fieldErrors: { countryId: 'Pays introuvable.' } };
  }
  return {
    ok: false,
    fieldErrors: {},
    formError: apiError?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
  };
}

export async function createCityAction(input: CityFormInput): Promise<CityFormFailure | never> {
  const parsed = cityFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    await apiFetch<CityRow>('/cities', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/cities');
  redirect('/admin/cities?created=1');
}

export async function updateCityAction(
  id: string,
  input: CityFormInput,
): Promise<CityFormFailure | never> {
  const parsed = cityFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    await apiFetch<CityRow>(`/cities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/cities');
  redirect('/admin/cities?updated=1');
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function deleteCityAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/cities/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la suppression.',
    };
  }
  revalidatePath('/admin/cities');
  return { ok: true };
}
