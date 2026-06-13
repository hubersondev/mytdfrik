'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export interface TransitionResult {
  ok: boolean;
  message?: string;
  /** Statut courant renvoyé par l'API en cas de conflit (409). */
  currentStatus?: string;
}

interface TransitionPayload {
  expectedStatus: string;
  note?: string;
  assigneeId?: string;
  effectivePriorityId?: string;
}

/**
 * Applique une transition de la machine à états sur une demande.
 * Traduit les codes d'erreur de l'API en messages exploitables par l'UI.
 */
export async function applyTransitionAction(
  reference: string,
  requestId: string,
  code: string,
  payload: TransitionPayload,
): Promise<TransitionResult> {
  try {
    await apiFetch(`/requests/${requestId}/transitions/${code}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const apiError = error as {
      status?: number;
      code?: string;
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
      return { ok: false, message: 'Action non autorisée pour votre rôle.' };
    }
    if (apiError?.status === 400) {
      return { ok: false, message: apiError.message ?? 'Données invalides.' };
    }
    return { ok: false, message: apiError?.message ?? 'Échec de l’action.' };
  }

  revalidatePath(`/admin/requests/${reference}`);
  revalidatePath('/admin/requests');
  return { ok: true };
}

export interface DiagnosticPayload {
  isReproduced: 'OUI' | 'NON' | 'PARTIEL' | 'NON_TESTE';
  rootCause: string;
  correctiveAction: string;
  workaround?: string;
  fixDeployed?: boolean;
  workaroundOnly?: boolean;
}

/** Consigne le diagnostic d'un bug (Responsable, CDC §6.3.2). */
export async function submitDiagnosticAction(
  reference: string,
  requestId: string,
  payload: DiagnosticPayload,
): Promise<TransitionResult> {
  try {
    await apiFetch(`/requests/${requestId}/bug-diagnostic`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const apiError = error as { status?: number; message?: string };
    if (apiError?.status === 403) {
      return { ok: false, message: 'Seul un responsable traitant peut consigner le diagnostic.' };
    }
    return { ok: false, message: apiError?.message ?? 'Échec de l’enregistrement du diagnostic.' };
  }
  revalidatePath(`/admin/requests/${reference}`);
  return { ok: true };
}
