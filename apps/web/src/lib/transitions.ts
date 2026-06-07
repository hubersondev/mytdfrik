/**
 * Descripteurs des transitions de la machine à états (CDC §4) côté front.
 * L'API renvoie les **codes** applicables (`GET /requests/:id/transitions`) ;
 * ce mapping fournit le libellé du bouton et les champs requis par le
 * formulaire d'action. La validation fait foi côté serveur.
 */

export interface TransitionUi {
  label: string;
  /** Verbe court pour le bouton. */
  cta: string;
  requiresNote: boolean;
  /** Libellé du champ note (motif / message / résumé). */
  noteLabel?: string;
  /** Sélection d'un responsable (T06). */
  needsAssignee?: boolean;
  /** Ajustement de priorité possible (T02). */
  allowsPriority?: boolean;
  /** Tonalité du bouton. */
  tone: 'default' | 'neutral' | 'destructive' | 'outline';
}

export const TRANSITION_UI: Record<string, TransitionUi> = {
  T02: {
    label: 'Qualifier la demande',
    cta: 'Qualifier',
    requiresNote: false,
    allowsPriority: true,
    noteLabel: "Motif d'ajustement de priorité (si modifiée)",
    tone: 'default',
  },
  T03: {
    label: 'Demander un complément au client',
    cta: 'Demander un complément',
    requiresNote: true,
    noteLabel: 'Message au client',
    tone: 'outline',
  },
  T05: {
    label: 'Rejeter la demande',
    cta: 'Rejeter',
    requiresNote: true,
    noteLabel: 'Motif du rejet',
    tone: 'destructive',
  },
  T06: {
    label: 'Affecter à un responsable',
    cta: 'Affecter',
    requiresNote: false,
    needsAssignee: true,
    tone: 'default',
  },
  T07: {
    label: 'Demander un complément au client',
    cta: 'Demander un complément',
    requiresNote: true,
    noteLabel: 'Message au client',
    tone: 'outline',
  },
  T08: {
    label: 'Prendre en charge',
    cta: 'Prendre en charge',
    requiresNote: false,
    tone: 'default',
  },
  T09: {
    label: "Refuser l'affectation",
    cta: "Refuser l'affectation",
    requiresNote: true,
    noteLabel: 'Motif du refus',
    tone: 'destructive',
  },
  T10: {
    label: 'Demander un complément au client',
    cta: 'Demander un complément',
    requiresNote: true,
    noteLabel: 'Message au client',
    tone: 'outline',
  },
  T11: {
    label: 'Proposer une résolution',
    cta: 'Proposer une résolution',
    requiresNote: true,
    noteLabel: 'Résumé de la résolution',
    tone: 'default',
  },
  T12: {
    label: 'Demander une réaffectation',
    cta: 'Réaffecter',
    requiresNote: true,
    noteLabel: 'Motif de la réaffectation',
    tone: 'outline',
  },
  T16: {
    label: 'Valider la résolution',
    cta: 'Valider',
    requiresNote: false,
    tone: 'default',
  },
  T18: {
    label: 'Refuser la résolution',
    cta: 'Refuser',
    requiresNote: true,
    noteLabel: 'Motif du refus',
    tone: 'destructive',
  },
  T19: {
    label: 'Rouvrir la demande',
    cta: 'Rouvrir',
    requiresNote: true,
    noteLabel: 'Motif de la réouverture',
    tone: 'outline',
  },
  T04: {
    label: 'Annuler la demande',
    cta: 'Annuler la demande',
    requiresNote: false,
    noteLabel: 'Motif (optionnel)',
    tone: 'destructive',
  },
  CLIENT_REPLY: {
    label: 'Répondre',
    cta: 'Répondre',
    requiresNote: true,
    noteLabel: 'Votre réponse',
    tone: 'default',
  },
};

export function transitionUi(code: string): TransitionUi {
  return (
    TRANSITION_UI[code] ?? {
      label: code,
      cta: code,
      requiresNote: false,
      tone: 'neutral',
    }
  );
}
