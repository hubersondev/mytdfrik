'use server';

import { redirect } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { clearSession, getSession } from '@/lib/auth';

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });
    } catch {
      // Best effort — on supprime de toute façon le cookie local.
    }
  }
  await clearSession();
  redirect('/login');
}
