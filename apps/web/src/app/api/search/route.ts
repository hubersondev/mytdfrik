import { NextResponse } from 'next/server';
import { apiFetchOr } from '@/lib/api';
import type { GlobalSearchResults } from '@/lib/search';

const EMPTY: GlobalSearchResults = {
  query: '',
  requests: [],
  users: [],
  products: [],
  categories: [],
};

/**
 * Proxy authentifié pour la recherche globale (palette ⌘K).
 * Le JWT vit dans un cookie httpOnly inaccessible au JS client ; cette route
 * lit le cookie côté serveur et relaie l'appel vers l'API NestJS.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json(EMPTY);
  }
  const results = await apiFetchOr<GlobalSearchResults>(`/search?q=${encodeURIComponent(q)}`, {
    ...EMPTY,
    query: q,
  });
  return NextResponse.json(results);
}
