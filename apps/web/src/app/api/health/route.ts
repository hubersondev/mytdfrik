import { NextResponse } from 'next/server';

/**
 * Sonde de disponibilité du serveur Next.js, utilisée par le HEALTHCHECK Docker.
 *
 * Volontairement autonome : aucun appel à l'API NestJS, aucune lecture de
 * cookie. Un front en bonne santé ne doit pas être déclaré `unhealthy` parce
 * que le backend est lent ou indisponible — Traefik retirerait alors le
 * conteneur de ses routeurs, transformant une panne d'API en panne totale.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok', service: 'mytdfrik-web' });
}
