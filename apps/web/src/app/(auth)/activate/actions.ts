'use server';

import { redirect } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import type { SetPasswordResult } from '@/components/auth/set-password-form';

/** Active un compte via le jeton reçu par e-mail (POST /auth/activate). */
export async function activateAction(
  token: string,
  password: string,
): Promise<SetPasswordResult | never> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
      cache: 'no-store',
    });
  } catch {
    return { error: "Impossible de joindre l'API. Réessayez plus tard." };
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 404 || response.status === 410) {
      return {
        error:
          "Ce lien d'activation est invalide ou expiré. Demandez un nouveau lien à votre administrateur.",
      };
    }
    return { error: 'Erreur inattendue. Réessayez.' };
  }

  redirect('/login?activated=1');
}
