/** Types des tableaux de bord (CDC §3.11, M13). Alignés sur l'API `/metrics`. */

export interface OperationalMetrics {
  enCours: number;
  enAttenteClient: number;
  enRetardSla: number;
  aCloturer: number;
  chargeResponsables: Array<{
    userId: string;
    name: string;
    actives: number;
    resolues: number;
  }>;
}

export interface StrategicMetrics {
  from: string;
  to: string;
  volume: { recues: number; resolues: number; cloturees: number };
  delaisMoyens: {
    priseEnChargeMinutes: number | null;
    resolutionMinutes: number | null;
  };
  tauxSatisfaction: number | null;
  nbEvaluations: number;
  tauxReouverture: number | null;
  distributionParCategorie: Array<{ code: string; label: string; count: number }>;
  distributionParPriorite: Array<{ priorityId: string; count: number }>;
  bugsParProduit: Array<{
    code: string;
    label: string;
    total: number;
    reproduits: number;
  }>;
}

/** Formate une durée en minutes vers « 2h30 », « 3j 4h », etc. */
export function formatMinutes(min: number | null): string {
  if (min === null) return '—';
  if (min < 0) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const j = Math.floor(h / 24);
  const r = h % 24;
  return r === 0 ? `${j} j` : `${j} j ${r} h`;
}
