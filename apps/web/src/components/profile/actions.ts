'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, isNextRedirect } from '@/lib/api';
import { getSession, setSession } from '@/lib/auth';

export interface ProfileResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  timeZone: string;
}

/** Met à jour le profil de l'utilisateur connecté + rafraîchit la session. */
export async function updateProfileAction(input: {
  firstName: string;
  lastName: string;
  phone?: string;
  timeZone: string;
}): Promise<ProfileResult> {
  const firstName = input.firstName?.trim() ?? '';
  const lastName = input.lastName?.trim() ?? '';
  if (firstName.length < 1 || lastName.length < 1) {
    return { ok: false, fieldErrors: { firstName: 'Prénom et nom sont requis.' } };
  }
  let me: MeResponse;
  try {
    me = await apiFetch<MeResponse>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        firstName,
        lastName,
        phone: input.phone?.trim() || undefined,
        timeZone: input.timeZone,
      }),
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return {
      ok: false,
      message: (error as { message?: string })?.message ?? 'Échec de la mise à jour.',
    };
  }

  // Rafraîchit le cookie de session pour refléter le nouveau nom dans l'en-tête.
  const session = await getSession();
  if (session) {
    await setSession({
      ...session,
      user: {
        ...session.user,
        firstName: me.firstName,
        lastName: me.lastName,
        timeZone: me.timeZone,
      },
    });
  }
  revalidatePath('/admin/profile');
  revalidatePath('/client/profile');
  return { ok: true };
}

/** Change le mot de passe de l'utilisateur connecté. */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ProfileResult> {
  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const apiError = error as { status?: number; code?: string; message?: string };
    if (apiError?.code === 'INVALID_CURRENT_PASSWORD') {
      return { ok: false, fieldErrors: { currentPassword: 'Mot de passe actuel incorrect.' } };
    }
    if (apiError?.status === 400) {
      return {
        ok: false,
        fieldErrors: { newPassword: apiError.message ?? 'Mot de passe invalide.' },
      };
    }
    return { ok: false, message: apiError?.message ?? 'Échec du changement de mot de passe.' };
  }
  return { ok: true };
}
