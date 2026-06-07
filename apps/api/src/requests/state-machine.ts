import type { RequestStatus } from '../database/entities';

/**
 * Machine à états des demandes (CDC §4). Définition **déclarative** des 19
 * transitions T01–T19 : le moteur (state-machine.service) fait foi côté serveur
 * (CDC §4.4 [EXG-04-013]). Toute transition non listée est interdite (409).
 *
 * Les transitions T13/T14/T15 (réponse du Client après complément) ont une
 * cible **dynamique** déterminée par `previous_status_before_wait` : elles sont
 * regroupées sous le code logique `CLIENT_REPLY` et résolues à l'exécution.
 * T17 (clôture auto) est déclenchée par un job planifié (S7), pas par l'API.
 */

export type TransitionCode =
  | 'T02'
  | 'T03'
  | 'T04'
  | 'T05'
  | 'T06'
  | 'T07'
  | 'T08'
  | 'T09'
  | 'T10'
  | 'T11'
  | 'T12'
  | 'T16'
  | 'T18'
  | 'T19'
  | 'CLIENT_REPLY';

/** Qui peut déclencher la transition. */
export type TransitionActor =
  | { kind: 'PERMISSION'; permission: string } // rôle interne disposant de la permission
  | { kind: 'CLIENT_OWNER' } // Client propriétaire de la demande (scope CLIENT)
  | { kind: 'SYSTEM' }; // déclenché par un job interne

export interface TransitionDef {
  code: TransitionCode;
  /** Statuts sources admis. */
  from: RequestStatus[];
  /** Statut cible fixe, ou null si dynamique (résolu à l'exécution). */
  to: RequestStatus | null;
  actor: TransitionActor;
  /** Un motif / message est-il obligatoire ? */
  requiresNote: boolean;
  /** Événement métier émis (CDC §4.8, consommé par notifications/audit). */
  event: string;
  /** Libellé court de l'action (UI, journal). */
  label: string;
}

export const TRANSITIONS: Record<TransitionCode, TransitionDef> = {
  T02: {
    code: 'T02',
    from: ['NOUVELLE'],
    to: 'EN_ATTENTE_AFFECTATION',
    actor: { kind: 'PERMISSION', permission: 'requests.qualify' },
    requiresNote: false,
    event: 'DEMANDE_QUALIFIEE',
    label: 'Qualifier la demande',
  },
  T03: {
    code: 'T03',
    from: ['NOUVELLE'],
    to: 'EN_ATTENTE_CLIENT',
    actor: { kind: 'PERMISSION', permission: 'requests.qualify' },
    requiresNote: true,
    event: 'COMPLEMENT_DEMANDE',
    label: 'Demander un complément',
  },
  T04: {
    code: 'T04',
    from: ['NOUVELLE'],
    to: 'ANNULEE',
    actor: { kind: 'CLIENT_OWNER' },
    requiresNote: false,
    event: 'DEMANDE_ANNULEE',
    label: 'Annuler la demande',
  },
  T05: {
    code: 'T05',
    from: ['NOUVELLE'],
    to: 'ANNULEE',
    actor: { kind: 'PERMISSION', permission: 'requests.qualify' },
    requiresNote: true,
    event: 'DEMANDE_REJETEE',
    label: 'Rejeter la demande',
  },
  T06: {
    code: 'T06',
    from: ['EN_ATTENTE_AFFECTATION'],
    to: 'AFFECTEE',
    actor: { kind: 'PERMISSION', permission: 'requests.assign' },
    requiresNote: false,
    event: 'DEMANDE_AFFECTEE',
    label: 'Affecter à un responsable',
  },
  T07: {
    code: 'T07',
    from: ['EN_ATTENTE_AFFECTATION'],
    to: 'EN_ATTENTE_CLIENT',
    actor: { kind: 'PERMISSION', permission: 'requests.assign' },
    requiresNote: true,
    event: 'COMPLEMENT_DEMANDE',
    label: 'Demander un complément',
  },
  T08: {
    code: 'T08',
    from: ['AFFECTEE'],
    to: 'EN_COURS',
    actor: { kind: 'PERMISSION', permission: 'requests.process' },
    requiresNote: false,
    event: 'TRAITEMENT_DEMARRE',
    label: 'Prendre en charge',
  },
  T09: {
    code: 'T09',
    from: ['AFFECTEE'],
    to: 'NOUVELLE',
    actor: { kind: 'PERMISSION', permission: 'requests.process' },
    requiresNote: true,
    event: 'AFFECTATION_REFUSEE',
    label: "Refuser l'affectation",
  },
  T10: {
    code: 'T10',
    from: ['EN_COURS'],
    to: 'EN_ATTENTE_CLIENT',
    actor: { kind: 'PERMISSION', permission: 'requests.process' },
    requiresNote: true,
    event: 'COMPLEMENT_DEMANDE',
    label: 'Demander un complément',
  },
  T11: {
    code: 'T11',
    from: ['EN_COURS'],
    to: 'RESOLUE',
    actor: { kind: 'PERMISSION', permission: 'requests.process' },
    requiresNote: true,
    event: 'RESOLUTION_PROPOSEE',
    label: 'Proposer une résolution',
  },
  T12: {
    code: 'T12',
    from: ['EN_COURS'],
    to: 'NOUVELLE',
    actor: { kind: 'PERMISSION', permission: 'requests.process' },
    requiresNote: true,
    event: 'REAFFECTATION_DEMANDEE',
    label: 'Demander une réaffectation',
  },
  T16: {
    code: 'T16',
    from: ['RESOLUE'],
    to: 'CLOTUREE',
    actor: { kind: 'CLIENT_OWNER' },
    requiresNote: false,
    event: 'DEMANDE_CLOTUREE',
    label: 'Valider la résolution',
  },
  T18: {
    code: 'T18',
    from: ['RESOLUE'],
    to: 'EN_COURS',
    actor: { kind: 'CLIENT_OWNER' },
    requiresNote: true,
    event: 'RESOLUTION_REFUSEE',
    label: 'Refuser la résolution',
  },
  T19: {
    code: 'T19',
    from: ['CLOTUREE'],
    to: 'NOUVELLE',
    actor: { kind: 'CLIENT_OWNER' },
    requiresNote: true,
    event: 'DEMANDE_REOUVERTE',
    label: 'Rouvrir la demande',
  },
  // Réponse du Client après une demande de complément (T13/T14/T15). Cible
  // dynamique = previous_status_before_wait. Déclenchée par la messagerie (S6)
  // mais exposée ici pour complétude du moteur.
  CLIENT_REPLY: {
    code: 'CLIENT_REPLY',
    from: ['EN_ATTENTE_CLIENT'],
    to: null,
    actor: { kind: 'CLIENT_OWNER' },
    requiresNote: true,
    event: 'CLIENT_A_REPONDU',
    label: 'Répondre',
  },
};

/** Cibles possibles à la reprise après EN_ATTENTE_CLIENT (T13/T14/T15). */
const CLIENT_REPLY_TARGETS: RequestStatus[] = [
  'NOUVELLE',
  'EN_ATTENTE_AFFECTATION',
  'EN_COURS',
];

export interface ResolveTargetResult {
  to: RequestStatus;
  /** Code historique « réel » (T13/T14/T15) selon la cible. */
  effectiveCode: string;
}

/**
 * Résout la cible d'une transition CLIENT_REPLY à partir du statut antérieur.
 * Retourne null si le statut antérieur est absent ou non repris en charge.
 */
export function resolveClientReplyTarget(
  previousStatus: RequestStatus | null,
): ResolveTargetResult | null {
  if (!previousStatus || !CLIENT_REPLY_TARGETS.includes(previousStatus)) {
    return null;
  }
  const map: Record<string, string> = {
    NOUVELLE: 'T13',
    EN_ATTENTE_AFFECTATION: 'T14',
    EN_COURS: 'T15',
  };
  return { to: previousStatus, effectiveCode: map[previousStatus] };
}

/** Vrai si `code` est une transition connue. */
export function isTransitionCode(code: string): code is TransitionCode {
  return code in TRANSITIONS;
}

/** Transitions applicables depuis un statut donné (pour l'UI). */
export function transitionsFrom(status: RequestStatus): TransitionDef[] {
  return Object.values(TRANSITIONS).filter((t) => t.from.includes(status));
}
