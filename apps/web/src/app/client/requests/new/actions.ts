'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { RequestDetail } from '@/lib/requests';
import { createRequestSchema, type CreateRequestInput } from './schema';

export interface CreateRequestFailure {
  ok: false;
  fieldErrors: Partial<Record<keyof CreateRequestInput, string>>;
  formError?: string;
}

export type CreateRequestResult = CreateRequestFailure;

/**
 * Server Action de soumission d'une demande Client.
 * - Re-valide via Zod côté serveur (défense en profondeur).
 * - Délègue la création au backend NestJS (POST /requests).
 * - En cas de succès, redirige vers le détail de la demande créée. Le redirect
 *   est lancé via `redirect()` à l'extérieur du try/catch, sinon NEXT_REDIRECT
 *   serait capturé comme une erreur HTTP normale.
 */
export async function submitRequestAction(
  input: CreateRequestInput,
): Promise<CreateRequestResult | never> {
  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: CreateRequestFailure['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key as keyof CreateRequestInput] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  let created: RequestDetail;
  try {
    created = await apiFetch<RequestDetail>('/requests', {
      method: 'POST',
      body: JSON.stringify({
        ...parsed.data,
        clientContextNote: parsed.data.clientContextNote?.trim() || undefined,
      }),
    });
  } catch (error) {
    const apiError = error as { status?: number; code?: string; message?: string };
    if (apiError?.status === 400 && apiError?.code === 'CATEGORY_INACTIVE') {
      return {
        ok: false,
        fieldErrors: { categoryId: "Cette catégorie n'accepte plus de nouvelles demandes." },
      };
    }
    if (apiError?.status === 404 && apiError?.code === 'CATEGORY_NOT_FOUND') {
      return {
        ok: false,
        fieldErrors: { categoryId: 'Catégorie introuvable.' },
      };
    }
    return {
      ok: false,
      fieldErrors: {},
      formError:
        apiError?.message ??
        "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.",
    };
  }

  redirect(`/client/requests/${created.publicReference}?created=1`);
}
