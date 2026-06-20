import 'server-only';
import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  hasPermission,
  type RoleScope,
  type SessionPayload,
  type SessionUser,
} from './session-cookie';

// Ré-exporte les constantes/types neutres pour préserver les imports existants
// depuis '@/lib/auth' (le middleware, lui, importe depuis './session-cookie').
export { AUTH_COOKIE_NAME, hasPermission };
export type { RoleScope, SessionPayload, SessionUser };

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
