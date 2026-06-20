'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, isNextRedirect } from '@/lib/api';
import type { CountryRow } from '@/lib/geo';
import { countryFormSchema, type CountryFormInput } from './schema';

export interface CountryFormFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof CountryFormInput, string>>;
  formError?: string;
}

function collectFieldErrors(
  issues: readonly { readonly path: PropertyKey[]; readonly message: string }[],
): CountryFormFailure['fieldErrors'] {
  const fieldErrors: CountryFormFailure['fieldErrors'] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key as keyof CountryFormInput] = issue.message;
    }
  }
  return fieldErrors;
}

function mapApiError(error: unknown): CountryFormFailure {
  if (isNextRedirect(error)) throw error;
  const apiError = error as { status?: number; code?: string; message?: string };
  if (apiError?.status === 409 && apiError?.code === 'COUNTRY_CODE_TAKEN') {
    return { ok: false, fieldErrors: { code: 'Ce code pays est déjà utilisé.' } };
  }
  return {
    ok: false,
    fieldErrors: {},
    formError: apiError?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
  };
}

export async function createCountryAction(
  input: CountryFormInput,
): Promise<CountryFormFailure | never> {
  const parsed = countryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    await apiFetch<CountryRow>('/countries', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/countries');
  redirect('/admin/countries?created=1');
}

export async function updateCountryAction(
  id: string,
  input: CountryFormInput,
): Promise<CountryFormFailure | never> {
  const parsed = countryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    await apiFetch<CountryRow>(`/countries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/countries');
  redirect('/admin/countries?updated=1');
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function deleteCountryAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/countries/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la suppression.',
    };
  }
  revalidatePath('/admin/countries');
  return { ok: true };
}
