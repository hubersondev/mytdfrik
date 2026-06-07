import type {
  ImpactValue,
  PriorityLevelCode,
  UrgencyValue,
} from '../database/entities';

/**
 * Matrice Impact × Urgence — CDC §5.4 [EXG-05-050].
 *
 * Le client ne saisit jamais directement la priorité (§5.1 [EXG-05-001]).
 * Cette table fait foi. Toute modification doit suivre l'amendement du CDC
 * et être validée par la Direction Générale.
 */
const MATRIX: Record<ImpactValue, Record<UrgencyValue, PriorityLevelCode>> = {
  BLOCAGE_TOTAL: {
    CRITIQUE: 'P0',
    ELEVEE: 'P1',
    MODEREE: 'P1',
    FAIBLE: 'P2',
  },
  BLOCAGE_PARTIEL: {
    CRITIQUE: 'P1',
    ELEVEE: 'P2',
    MODEREE: 'P2',
    FAIBLE: 'P3',
  },
  DEGRADATION: {
    CRITIQUE: 'P2',
    ELEVEE: 'P2',
    MODEREE: 'P3',
    FAIBLE: 'P4',
  },
  AUCUN_IMPACT: {
    CRITIQUE: 'P3',
    ELEVEE: 'P3',
    MODEREE: 'P4',
    FAIBLE: 'P4',
  },
};

export const PRIORITY_ORDER: Record<PriorityLevelCode, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
};

/**
 * Vrai si `target` ne s'écarte de `reference` que d'un niveau au plus
 * (override Gestionnaire borné ±1 — CDC §5.5 [EXG-05-061]).
 */
export function isWithinOneLevel(
  reference: PriorityLevelCode,
  target: PriorityLevelCode,
): boolean {
  return Math.abs(PRIORITY_ORDER[reference] - PRIORITY_ORDER[target]) <= 1;
}

/** Priorité brute issue de la matrice (sans pondération catégorie). */
export function priorityFromMatrix(
  impact: ImpactValue,
  urgency: UrgencyValue,
): PriorityLevelCode {
  return MATRIX[impact][urgency];
}

/**
 * Priorité système finale (CDC §5.4.1 [EXG-05-051..052]).
 *
 * La pondération catégorie ne peut **qu'élever** la priorité, jamais l'abaisser :
 *   - si default_priority est plus prioritaire (numéro plus bas) que la matrice,
 *     elle gagne ;
 *   - sinon la matrice gagne.
 */
export function computeSystemPriority(
  impact: ImpactValue,
  urgency: UrgencyValue,
  categoryDefaultPriority: PriorityLevelCode,
): PriorityLevelCode {
  const fromMatrix = priorityFromMatrix(impact, urgency);
  return PRIORITY_ORDER[categoryDefaultPriority] < PRIORITY_ORDER[fromMatrix]
    ? categoryDefaultPriority
    : fromMatrix;
}
