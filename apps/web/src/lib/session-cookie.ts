/**
 * Constantes et types du cookie de session — module **neutre** (ni `server-only`
 * ni `next/headers`) pour être importable aussi bien côté serveur que dans le
 * middleware (runtime edge). La logique de lecture/écriture vit dans `auth.ts`.
 */

/** Cookie HttpOnly portant la session (JWT + refresh token). */
export const AUTH_COOKIE_NAME = 'mytdfrik_session';

/** Durée de vie du cookie = celle du refresh token (7 jours). */
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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

export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch seconds
  user: SessionUser;
}

/** Vrai si l'utilisateur possède la permission (ou s'il est super-admin). */
export function hasPermission(user: SessionUser, code: string): boolean {
  return user.permissions.includes(code);
}
