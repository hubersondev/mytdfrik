'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export interface MessageActionResult {
  ok: boolean;
  message?: string;
}

/** Publie un message sur une demande. `revalidate` = chemin de la page à rafraîchir. */
export async function postMessageAction(
  requestId: string,
  revalidate: string,
  input: { body: string; isInternal?: boolean },
): Promise<MessageActionResult> {
  if (!input.body.trim()) {
    return { ok: false, message: 'Le message ne peut pas être vide.' };
  }
  try {
    await apiFetch(`/requests/${requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: input.body.trim(), isInternal: input.isInternal ?? false }),
    });
  } catch (error) {
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de l’envoi du message.',
    };
  }
  revalidatePath(revalidate);
  return { ok: true };
}

/** Retire un message (auteur uniquement). */
export async function withdrawMessageAction(
  messageId: string,
  revalidate: string,
  reason: string,
): Promise<MessageActionResult> {
  if (reason.trim().length < 3) {
    return { ok: false, message: 'Indiquez un motif (au moins 3 caractères).' };
  }
  try {
    await apiFetch(`/requests/messages/${messageId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() }),
    });
  } catch (error) {
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec du retrait.',
    };
  }
  revalidatePath(revalidate);
  return { ok: true };
}
