import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, type SessionPayload } from './auth';

/**
 * Détecte les exceptions spéciales lancées par redirect() de Next.js
 * (digest commence par 'NEXT_REDIRECT'). Ces erreurs ne doivent jamais
 * être attrapées par les .catch() naïfs, sinon le redirect ne s'exécute pas.
 */
function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

/**
 * Wrapper utilitaire : retourne `fallback` en cas d'erreur HTTP standard
 * (ex. 5xx, 404 sur une ressource optionnelle), tout en laissant remonter
 * les redirects Next.js (générés par les 401 → /api/auth/clear).
 */
export async function apiFetchOr<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path);
  } catch (err) {
    if (isNextRedirect(err)) {
      throw err;
    }
    return fallback;
  }
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}

/**
 * Wrapper fetch authentifié côté serveur (Server Components / Route Handlers).
 * Lit le JWT depuis le cookie httpOnly et propage Authorization: Bearer.
 *
 * Comportement sur erreur :
 * - 401 sur une route authentifiée : redirige vers /login?expired=1 (la page
 *   login purge le cookie pourri). Évite une boucle infinie quand le cookie
 *   côté navigateur est encore présent mais que le JWT est expiré côté API.
 * - Tout autre status ≥ 400 : lance ApiError pour gestion en amont.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session: SessionPayload | null = raw ? safeParseJson<SessionPayload>(raw) : null;

  // Pour un envoi multipart (FormData), on laisse fetch positionner lui-même
  // le Content-Type avec la boundary ; forcer application/json casserait l'upload.
  const isFormData = rest.body instanceof FormData;

  const finalHeaders: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(auth && session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    ...headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: 'no-store',
  });

  if (response.status === 401 && auth) {
    // Session API expirée ou invalide → on redirige vers une Route Handler
    // qui purge le cookie (impossible depuis un Server Component) puis
    // renvoie vers /login. `redirect()` lance NEXT_REDIRECT, ce n'est pas
    // une vraie exception métier.
    redirect('/api/auth/clear');
  }

  if (!response.ok) {
    const text = await response.text();
    const parsed = safeParseJson<{ code?: string; message?: string }>(text);
    const error: ApiError = {
      status: response.status,
      code: parsed?.code,
      message: parsed?.message ?? response.statusText,
      details: parsed,
    };
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
