import 'server-only';
import { cookies } from 'next/headers';

export type Theme = 'light' | 'dark';

const COOKIE_NAME = 'mytdfrik_theme';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Thème courant lu côté serveur (Server Components / Route Handlers).
 * Par défaut : 'dark'. Conserve le choix utilisateur via cookie persistent.
 */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  return raw === 'light' ? 'light' : 'dark';
}

export async function setTheme(theme: Theme): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: theme,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
}
