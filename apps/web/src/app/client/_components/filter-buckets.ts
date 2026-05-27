/**
 * Buckets de statuts présentés au Client (CDC §4.1).
 * Module **sans** `'use client'` : peut être consommé indistinctement par les
 * Server Components (résolution du bucket depuis `searchParams`) et par le
 * composant `FilterMenu` côté client.
 */
export const FILTER_BUCKETS = {
  ALL: { label: 'Toutes les demandes', statuses: null },
  OPEN: {
    label: 'En cours',
    statuses: ['NOUVELLE', 'EN_ATTENTE_AFFECTATION', 'AFFECTEE', 'EN_COURS'],
  },
  WAITING_CLIENT: { label: 'En attente de votre retour', statuses: ['EN_ATTENTE_CLIENT'] },
  RESOLVED: { label: 'Résolues', statuses: ['RESOLUE', 'CLOTUREE'] },
  CANCELLED: { label: 'Annulées', statuses: ['ANNULEE'] },
} as const;

export type FilterBucketKey = keyof typeof FILTER_BUCKETS;

export const BUCKET_ORDER: FilterBucketKey[] = [
  'ALL',
  'OPEN',
  'WAITING_CLIENT',
  'RESOLVED',
  'CANCELLED',
];

/**
 * Reconstruit la clé du bucket à partir du paramètre `status` lu dans l'URL.
 * Tolère l'ordre des valeurs et l'absence du paramètre.
 */
export function bucketKeyFromQuery(status: string | undefined | null): FilterBucketKey {
  if (!status) return 'ALL';
  const set = new Set(
    status
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  for (const key of BUCKET_ORDER) {
    const b = FILTER_BUCKETS[key];
    if (!b.statuses) continue;
    if (b.statuses.length === set.size && b.statuses.every((s: string) => set.has(s))) {
      return key;
    }
  }
  return 'ALL';
}
