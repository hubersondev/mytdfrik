'use server';

import { redirect } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { setSession } from '@/lib/auth';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: 'CLIENT' | 'GESTIONNAIRE' | 'RESPONSABLE' | 'ADMIN' | 'DG';
    organizationId: string | null;
    timeZone: string;
  };
}

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _previous: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email et mot de passe sont obligatoires.' };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return { error: "Impossible de joindre l'API. Réessayez plus tard." };
  }

  if (!response.ok) {
    if (response.status === 401) {
      return { error: 'Identifiants invalides.' };
    }
    if (response.status === 429) {
      return { error: 'Trop de tentatives. Patientez avant de réessayer.' };
    }
    return { error: 'Erreur inattendue. Réessayez.' };
  }

  const data = (await response.json()) as LoginResponse;
  await setSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    user: data.user,
  });

  // Routage post-login en fonction du rôle. Les rôles internes
  // (GESTIONNAIRE/RESPONSABLE/DG) atterrissent sur /admin en attendant leurs
  // propres espaces dédiés livrés dans les sprints suivants.
  if (data.user.roleId === 'CLIENT') {
    redirect('/client');
  }
  redirect('/admin');
}
