'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export interface ClientActionResult {
  ok: boolean;
  message?: string;
  currentStatus?: string;
}

interface TransitionPayload {
  expectedStatus: string;
  note?: string;
  assigneeId?: string;
  effectivePriorityId?: string;
}

/** Applique une transition côté Client (T16 valider, T18 refuser, T19 rouvrir, T04 annuler). */
export async function applyTransitionAction(
  reference: string,
  requestId: string,
  code: string,
  payload: TransitionPayload,
): Promise<ClientActionResult> {
  try {
    await apiFetch(`/requests/${requestId}/transitions/${code}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const apiError = error as {
      status?: number;
      message?: string;
      details?: { currentStatus?: string };
    };
    if (apiError?.status === 409) {
      return {
        ok: false,
        message: apiError.message ?? 'La demande a évolué entre-temps. Rafraîchissez la page.',
        currentStatus: apiError.details?.currentStatus,
      };
    }
    if (apiError?.status === 403) {
      return { ok: false, message: 'Action non autorisée.' };
    }
    return { ok: false, message: apiError?.message ?? 'Échec de l’action.' };
  }
  revalidatePath(`/client/requests/${reference}`);
  revalidatePath('/client/requests');
  return { ok: true };
}

/** Soumet l'évaluation de satisfaction d'une demande clôturée (CDC §8.4.12). */
export async function submitEvaluationAction(
  reference: string,
  requestId: string,
  score: number,
  comment: string,
): Promise<ClientActionResult> {
  try {
    await apiFetch(`/requests/${requestId}/evaluation`, {
      method: 'POST',
      body: JSON.stringify({ score, comment: comment.trim() || undefined }),
    });
  } catch (error) {
    const apiError = error as { status?: number; message?: string };
    return {
      ok: false,
      message: apiError?.message ?? "Échec de l'envoi de l'évaluation.",
    };
  }
  revalidatePath(`/client/requests/${reference}`);
  return { ok: true };
}
