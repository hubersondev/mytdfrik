import 'server-only';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'mytdfrik_sidebar';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Préférence d'affichage de la sidebar admin (étendue vs réduite aux icônes).
 * Stockée dans un cookie côté serveur — pas de FOUC, pas de flash au refresh.
 */
export async function getSidebarCollapsed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === 'collapsed';
}

export async function setSidebarCollapsed(collapsed: boolean): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: collapsed ? 'collapsed' : 'expanded',
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
}
