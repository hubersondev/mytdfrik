import type { PriorityLevelCode, RequestStatus } from '../database/entities';

/**
 * Libellés français présentés aux Clients (CDC §4.1, §5.1).
 * Centralisés ici pour rester cohérents entre emails, UI et exports CSV.
 */
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

const PRIORITY_LABELS: Record<PriorityLevelCode, string> = {
  P0: 'P0 — Critique',
  P1: 'P1 — Haute',
  P2: 'P2 — Moyenne',
  P3: 'P3 — Basse',
  P4: 'P4 — Très basse',
};

export const statusLabel = (status: RequestStatus): string =>
  STATUS_LABELS[status];
export const priorityLabel = (code: PriorityLevelCode): string =>
  PRIORITY_LABELS[code];

/**
 * Formate une date pour un Client en Côte d'Ivoire (Africa/Abidjan).
 * Utilisé dans les courriels — Intl.DateTimeFormat fonctionne en Node 22+.
 */
export function formatLocalDateTime(
  date: Date,
  timeZone = 'Africa/Abidjan',
): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}
