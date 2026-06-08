'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export interface AttachmentActionResult {
  ok: boolean;
  message?: string;
}

/** Téléverse une pièce jointe (multipart) sur une demande. */
export async function uploadAttachmentAction(
  requestId: string,
  revalidate: string,
  formData: FormData,
): Promise<AttachmentActionResult> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Sélectionnez un fichier.' };
  }
  const forward = new FormData();
  forward.append('file', file, file.name);
  try {
    await apiFetch(`/requests/${requestId}/attachments`, {
      method: 'POST',
      body: forward,
    });
  } catch (error) {
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec du téléversement.',
    };
  }
  revalidatePath(revalidate);
  return { ok: true };
}

/** Retire une pièce jointe (auteur uniquement). */
export async function withdrawAttachmentAction(
  attachmentId: string,
  revalidate: string,
  reason: string,
): Promise<AttachmentActionResult> {
  if (reason.trim().length < 3) {
    return { ok: false, message: 'Indiquez un motif (au moins 3 caractères).' };
  }
  try {
    await apiFetch(`/requests/attachments/${attachmentId}/withdraw`, {
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
