'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, isNextRedirect } from '@/lib/api';
import type { ProductRow } from '@/lib/products';
import { productFormSchema, type ProductFormInput } from './schema';

export interface ProductFormFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof ProductFormInput, string>>;
  formError?: string;
}

function collectFieldErrors(
  issues: readonly { readonly path: PropertyKey[]; readonly message: string }[],
): ProductFormFailure['fieldErrors'] {
  const fieldErrors: ProductFormFailure['fieldErrors'] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string') {
      fieldErrors[key as keyof ProductFormInput] = issue.message;
    }
  }
  return fieldErrors;
}

function payload(data: ProductFormInput) {
  return {
    code: data.code,
    label: data.label,
    description: data.description?.trim() || undefined,
    defaultOwnerTeam: data.defaultOwnerTeam?.trim() || undefined,
    requiresOs: data.requiresOs,
    requiresBrowser: data.requiresBrowser,
    isActive: data.isActive,
  };
}

function mapApiError(error: unknown): ProductFormFailure {
  if (isNextRedirect(error)) throw error;
  const apiError = error as { status?: number; code?: string; message?: string };
  if (apiError?.status === 409) {
    return { ok: false, fieldErrors: { code: 'Ce code produit existe déjà.' } };
  }
  return {
    ok: false,
    fieldErrors: {},
    formError: apiError?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
  };
}

export async function createProductAction(
  input: ProductFormInput,
): Promise<ProductFormFailure | never> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    await apiFetch<ProductRow>('/products', {
      method: 'POST',
      body: JSON.stringify(payload(parsed.data)),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/products');
  redirect('/admin/products?created=1');
}

export async function updateProductAction(
  id: string,
  input: ProductFormInput,
): Promise<ProductFormFailure | never> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  try {
    await apiFetch<ProductRow>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload(parsed.data)),
    });
  } catch (error) {
    return mapApiError(error);
  }
  revalidatePath('/admin/products');
  redirect('/admin/products?updated=1');
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch<void>(`/products/${id}`, { method: 'DELETE' });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la désactivation.',
    };
  }
  revalidatePath('/admin/products');
  return { ok: true };
}
