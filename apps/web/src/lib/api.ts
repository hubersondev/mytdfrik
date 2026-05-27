import 'server-only';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, type SessionPayload } from './auth';

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
 * Lance ApiError en cas de status ≥ 400.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session: SessionPayload | null = raw ? safeParseJson<SessionPayload>(raw) : null;

  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(auth && session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    ...headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: 'no-store',
  });

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
