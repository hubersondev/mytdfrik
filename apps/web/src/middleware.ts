import { NextResponse, type NextRequest } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  type SessionPayload,
} from '@/lib/session-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Marge avant expiration : on rafraîchit dès qu'il reste moins de 60 s de
 * validité, pour que le jeton tienne toute la durée de la requête.
 */
const REFRESH_SKEW_SECONDS = 60;

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: SessionPayload['user'];
}

/**
 * Rafraîchissement automatique du jeton d'accès (JWT 15 min) à partir du refresh
 * token (7 j, rotatif). Le middleware s'exécute **une seule fois par requête,
 * avant le rendu**, et peut écrire des cookies lisibles par le rendu courant —
 * c'est le seul endroit qui évite les courses de rotation du refresh token.
 *
 * Stratégie : si le jeton expire dans moins de REFRESH_SKEW_SECONDS, on appelle
 * /auth/refresh, on pose le nouveau cookie (requête courante + navigateur). En
 * cas d'échec, on purge le cookie : la page protégée redirige alors vers /login.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const raw = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!raw) return NextResponse.next();

  let session: SessionPayload | null = null;
  try {
    session = JSON.parse(raw) as SessionPayload;
  } catch {
    return NextResponse.next();
  }
  if (!session?.refreshToken || typeof session.expiresAt !== 'number') {
    return NextResponse.next();
  }

  const now = Math.floor(Date.now() / 1000);
  // Jeton encore valide : rien à faire.
  if (session.expiresAt - now > REFRESH_SKEW_SECONDS) {
    return NextResponse.next();
  }

  // Les prefetch du routeur ne doivent pas consommer le refresh token (rotation) :
  // deux requêtes concurrentes avec le même token déclencheraient une révocation.
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch';
  if (isPrefetch) return NextResponse.next();

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
      cache: 'no-store',
    });

    if (!res.ok) {
      // Refresh refusé (expiré/révoqué) : purge le cookie, la page gère le login.
      const response = NextResponse.next();
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    const data = (await res.json()) as RefreshResponse;
    const next: SessionPayload = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      user: data.user ?? session.user,
    };
    const value = JSON.stringify(next);

    // Rend le nouveau jeton lisible par le rendu de CETTE requête…
    request.cookies.set(AUTH_COOKIE_NAME, value);
    const response = NextResponse.next({ request });
    // …et le persiste côté navigateur.
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    // Erreur réseau : on laisse passer ; le 401 éventuel sera géré par apiFetch.
    return NextResponse.next();
  }
}

export const config = {
  // Portails protégés uniquement (login, statiques et /api exclus).
  matcher: ['/admin/:path*', '/client/:path*'],
};
