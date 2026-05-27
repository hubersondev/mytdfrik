import type {
  ImpactValue,
  PriorityLevelCode,
  UrgencyValue,
} from '../database/entities';
import { computeSystemPriority, priorityFromMatrix } from './priority-matrix';

describe('priorityFromMatrix — matrice CDC §5.4', () => {
  // Les 16 cellules — référence absolue du CDC.
  const expected: Array<[ImpactValue, UrgencyValue, PriorityLevelCode]> = [
    ['BLOCAGE_TOTAL', 'CRITIQUE', 'P0'],
    ['BLOCAGE_TOTAL', 'ELEVEE', 'P1'],
    ['BLOCAGE_TOTAL', 'MODEREE', 'P1'],
    ['BLOCAGE_TOTAL', 'FAIBLE', 'P2'],
    ['BLOCAGE_PARTIEL', 'CRITIQUE', 'P1'],
    ['BLOCAGE_PARTIEL', 'ELEVEE', 'P2'],
    ['BLOCAGE_PARTIEL', 'MODEREE', 'P2'],
    ['BLOCAGE_PARTIEL', 'FAIBLE', 'P3'],
    ['DEGRADATION', 'CRITIQUE', 'P2'],
    ['DEGRADATION', 'ELEVEE', 'P2'],
    ['DEGRADATION', 'MODEREE', 'P3'],
    ['DEGRADATION', 'FAIBLE', 'P4'],
    ['AUCUN_IMPACT', 'CRITIQUE', 'P3'],
    ['AUCUN_IMPACT', 'ELEVEE', 'P3'],
    ['AUCUN_IMPACT', 'MODEREE', 'P4'],
    ['AUCUN_IMPACT', 'FAIBLE', 'P4'],
  ];

  it.each(expected)('%s + %s → %s', (impact, urgency, expectedPriority) => {
    expect(priorityFromMatrix(impact, urgency)).toBe(expectedPriority);
  });
});

describe('computeSystemPriority — pondération catégorie', () => {
  it('garde la matrice quand la catégorie par défaut est moins prioritaire', () => {
    // P4 < P3 numériquement faux : P3 (3) < P4 (4) → P3 plus prioritaire.
    // Matrice DEGRADATION/MODEREE = P3, catégorie par défaut P4 (moins prio).
    expect(computeSystemPriority('DEGRADATION', 'MODEREE', 'P4')).toBe('P3');
  });

  it('élève à la priorité catégorie quand elle est plus prioritaire', () => {
    // Matrice DEGRADATION/FAIBLE = P4. Catégorie par défaut P1 (plus prio).
    expect(computeSystemPriority('DEGRADATION', 'FAIBLE', 'P1')).toBe('P1');
  });

  it('garde la matrice quand catégorie et matrice sont égales', () => {
    expect(computeSystemPriority('BLOCAGE_PARTIEL', 'CRITIQUE', 'P1')).toBe(
      'P1',
    );
  });

  it("n'abaisse jamais la priorité même si catégorie est moins prioritaire", () => {
    // Matrice BLOCAGE_TOTAL/CRITIQUE = P0. Catégorie P4 ne doit pas dégrader.
    expect(computeSystemPriority('BLOCAGE_TOTAL', 'CRITIQUE', 'P4')).toBe('P0');
  });
});
