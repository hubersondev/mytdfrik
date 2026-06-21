'use server';

import { redirect } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import type { SetPasswordResult } from '@/components/auth/set-password-form';

/** Confirme une réinitialisation via le jeton reçu (POST /auth/password-reset/confirm). */
export async function resetPasswordConfirmAction(
  token: string,
  newPassword: string,
): Promise<SetPasswordResult | never> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
      cache: 'no-store',
    });
  } catch {
    return { error: "Impossible de joindre l'API. Réessayez plus tard." };
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 404 || response.status === 410) {
      return {
        error:
          'Ce lien de réinitialisation est invalide ou expiré. Demandez-en un nouveau depuis la page de connexion.',
      };
    }
    return { error: 'Erreur inattendue. Réessayez.' };
  }

  redirect('/login?reset=1');
}
