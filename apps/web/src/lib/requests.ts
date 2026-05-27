/**
 * Types et constantes partagés du domaine "Demandes" — utilisés à la fois par
 * les Server Components (lecture API) et les Client Components (formulaire).
 *
 * Source de vérité : CDC §3, §4, §5. Les énumérations doivent rester
 * strictement alignées avec celles définies côté API
 * (`apps/api/src/database/entities/request.entity.ts`).
 */

export type ImpactValue = 'BLOCAGE_TOTAL' | 'BLOCAGE_PARTIEL' | 'DEGRADATION' | 'AUCUN_IMPACT';
export type UrgencyValue = 'CRITIQUE' | 'ELEVEE' | 'MODEREE' | 'FAIBLE';
export type RequestStatus =
  | 'NOUVELLE'
  | 'EN_ATTENTE_AFFECTATION'
  | 'AFFECTEE'
  | 'EN_COURS'
  | 'EN_ATTENTE_CLIENT'
  | 'RESOLUE'
  | 'CLOTUREE'
  | 'ANNULEE';
export type PriorityCode = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface CategoryOption {
  id: string;
  code: string;
  label: string;
  description: string | null;
  defaultPriorityId: PriorityCode;
  requiresBugDetails: boolean;
  isActive: boolean;
}

export interface RequestSummary {
  id: string;
  publicReference: string;
  title: string;
  status: RequestStatus;
  effectivePriorityId: PriorityCode;
  systemPriorityId: PriorityCode;
  impact: ImpactValue;
  urgency: UrgencyValue;
  createdAt: string;
  updatedAt: string;
  category: { id: string; code: string; label: string } | null;
}

export interface RequestDetail extends RequestSummary {
  description: string;
  clientContextNote: string | null;
  priorityOverrideReason: string | null;
  organizationId: string;
}

export const IMPACT_OPTIONS: Array<{
  value: ImpactValue;
  label: string;
  description: string;
}> = [
  {
    value: 'BLOCAGE_TOTAL',
    label: 'Blocage total',
    description: 'Activité métier complètement interrompue — impossible de travailler.',
  },
  {
    value: 'BLOCAGE_PARTIEL',
    label: 'Blocage partiel',
    description:
      "Partie significative de l'activité interrompue, un contournement existe difficilement.",
  },
  {
    value: 'DEGRADATION',
    label: 'Dégradation',
    description: 'Fonctionnement nominal dégradé, un contournement existe.',
  },
  {
    value: 'AUCUN_IMPACT',
    label: 'Aucun impact',
    description: 'Demande de service, suggestion ou question — aucune perte de productivité.',
  },
];

export const URGENCY_OPTIONS: Array<{
  value: UrgencyValue;
  label: string;
  description: string;
}> = [
  {
    value: 'CRITIQUE',
    label: 'Critique',
    description: 'Réponse attendue dans la journée.',
  },
  { value: 'ELEVEE', label: 'Élevée', description: 'Réponse attendue sous 48 heures ouvrées.' },
  { value: 'MODEREE', label: 'Modérée', description: 'Réponse attendue sous une semaine.' },
  { value: 'FAIBLE', label: 'Faible', description: 'Sans contrainte forte de délai.' },
];

const STATUS_LABELS: Record<RequestStatus, string> = {
  NOUVELLE: 'Nouvelle',
  EN_ATTENTE_AFFECTATION: "En attente d'affectation",
  AFFECTEE: 'Affectée',
  EN_COURS: 'En cours',
  EN_ATTENTE_CLIENT: 'En attente de votre retour',
  RESOLUE: 'Résolue',
  CLOTUREE: 'Clôturée',
  ANNULEE: 'Annulée',
};

const PRIORITY_LABELS: Record<PriorityCode, string> = {
  P0: 'P0 · Critique',
  P1: 'P1 · Haute',
  P2: 'P2 · Moyenne',
  P3: 'P3 · Basse',
  P4: 'P4 · Très basse',
};

export const statusLabel = (s: RequestStatus): string => STATUS_LABELS[s];
export const priorityLabel = (p: PriorityCode): string => PRIORITY_LABELS[p];

export function statusVariant(
  status: RequestStatus,
): 'secondary' | 'leaf' | 'brand' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'NOUVELLE':
    case 'EN_ATTENTE_AFFECTATION':
      return 'brand';
    case 'AFFECTEE':
    case 'EN_COURS':
      return 'leaf';
    case 'EN_ATTENTE_CLIENT':
      return 'warning';
    case 'RESOLUE':
    case 'CLOTUREE':
      return 'success';
    case 'ANNULEE':
      return 'secondary';
  }
}

/** Libellé court de priorité utilisé dans les cartouches SLA (sans le code Px). */
export function priorityShortLabel(code: PriorityCode): string {
  switch (code) {
    case 'P0':
      return 'Bloquant';
    case 'P1':
      return 'Critique';
    case 'P2':
      return 'Haute';
    case 'P3':
      return 'Normale';
    case 'P4':
      return 'Faible';
  }
}

/**
 * Formate une durée en minutes vers une notation compacte FR :
 *   45 → "45 min", 90 → "1h30", 1440 → "24h", 4320 → "3j".
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
  }
  const days = Math.floor(minutes / (60 * 24));
  return `${days}j`;
}

/**
 * Temps écoulé depuis `date`, format conversationnel français :
 *   < 1 min  → "à l'instant"
 *   < 1 h    → "Il y a N min"
 *   même jour calendaire → "Aujourd'hui, HH:MM"
 *   hier calendaire      → "Hier, HH:MM"
 *   < 7 jours            → "Il y a N jours"
 *   sinon                → "DD/MM/YYYY"
 */
export function formatRelativeTime(input: string | Date, now: Date = new Date()): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  const hhmm = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (diffDays === 0) return `Aujourd'hui, ${hhmm}`;
  if (diffDays === 1) return `Hier, ${hhmm}`;
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return new Intl.DateTimeFormat('fr-FR').format(date);
}
