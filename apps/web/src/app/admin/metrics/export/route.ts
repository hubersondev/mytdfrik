import { type NextRequest, NextResponse } from 'next/server';
import { API_BASE } from '@/lib/api';
import { getSession } from '@/lib/auth';

/**
 * Proxy d'export CSV des indicateurs (CDC §3.11 [EXG-03-101]). Le téléchargement
 * navigateur passe par cette route same-origin qui injecte le JWT (cookie
 * httpOnly) côté serveur avant d'appeler l'API.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }
  const params = req.nextUrl.searchParams.toString();
  const url = `${API_BASE}/metrics/strategic.csv${params ? `?${params}` : ''}`;
  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  });
  if (!upstream.ok) {
    return NextResponse.json({ message: 'Export indisponible' }, { status: upstream.status });
  }
  const csv = await upstream.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="indicateurs-mytdfrik.csv"',
    },
  });
}
