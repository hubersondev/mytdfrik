import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

/**
 * Purge la session côté Next.js et redirige vers /login.
 * Appelée quand l'API NestJS répond 401 (JWT expiré) alors que le cookie
 * navigateur est encore présent. Permet de casser la boucle infinie
 * (le Route Handler peut écrire/supprimer un cookie, le Server Component
 * de la page /login ne le peut pas).
 */
export async function GET(request: Request) {
  await clearSession();
  const url = new URL('/login?expired=1', request.url);
  return NextResponse.redirect(url, { status: 303 });
}
