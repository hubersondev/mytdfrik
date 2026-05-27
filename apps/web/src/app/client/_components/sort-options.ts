/**
 * Options de tri exposées au Client (CDC §9.4.3). Module **sans** `'use client'`
 * pour être consommable par les Server Components qui résolvent `searchParams`.
 */
export const SORT_OPTIONS = {
  activity_desc: {
    label: 'Activité récente',
    short: 'Récent',
    inline: 'tri par activité récente',
  },
  created_desc: {
    label: 'Soumission, plus récentes',
    short: 'Récent',
    inline: 'tri par date de soumission (récent → ancien)',
  },
  created_asc: {
    label: 'Soumission, plus anciennes',
    short: 'Ancien',
    inline: 'tri par date de soumission (ancien → récent)',
  },
  priority_asc: {
    label: 'Priorité (P0 → P4)',
    short: 'Priorité',
    inline: 'tri par priorité (P0 → P4)',
  },
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export const SORT_ORDER: SortKey[] = [
  'activity_desc',
  'created_desc',
  'created_asc',
  'priority_asc',
];

export const DEFAULT_SORT: SortKey = 'activity_desc';

/** Normalise la valeur lue dans `searchParams.sort` vers une clé valide. */
export function sortKeyFromQuery(value: string | undefined | null): SortKey {
  if (value && value in SORT_OPTIONS) return value as SortKey;
  return DEFAULT_SORT;
}
