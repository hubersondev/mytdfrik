import 'server-only';
import { cookies } from 'next/headers';

/**
 * Cookie HttpOnly portant la session — JWT + refresh token côté serveur uniquement.
 * Aucun accès JS côté client. Lifetime = celle du refresh token (7j).
 */
export const AUTH_COOKIE_NAME = 'mytdfrik_session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

export type RoleScope = 'INTERNAL' | 'CLIENT';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Code du rôle (dynamique depuis ADR-004). */
  roleId: string;
  organizationId: string | null;
  timeZone: string;
  /** Portail du rôle : INTERNAL → /admin, CLIENT → /client. */
  scope: RoleScope;
  /** Permissions effectives — sert à conditionner l'affichage côté UI. */
  permissions: string[];
}

/** Vrai si l'utilisateur possède la permission (ou s'il est super-admin). */
export function hasPermission(user: SessionUser, code: string): boolean {
  return user.permissions.includes(code);
}

export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch seconds
  user: SessionUser;
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(AUTH_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSession(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set({
    name: AUTH_COOKIE_NAME,
    value: JSON.stringify(payload),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}
