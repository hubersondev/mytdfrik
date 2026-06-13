/**
 * Domaine « Bugs structurés » côté front (CDC §6). Types partagés entre le
 * formulaire de création, l'affichage des détails et le panneau de diagnostic.
 */

export type IsReproducedValue = 'OUI' | 'NON' | 'PARTIEL' | 'NON_TESTE';

export const FREQUENCY_LABELS = [
  'À chaque utilisation',
  'Plusieurs fois par jour',
  'Plusieurs fois par semaine',
  'Occasionnel',
] as const;

export const IS_REPRODUCED_LABELS: Record<IsReproducedValue, string> = {
  OUI: 'Reproduit',
  NON: 'Non reproduit',
  PARTIEL: 'Partiellement reproduit',
  NON_TESTE: 'Non testé',
};

export interface ProductOption {
  id: string;
  code: string;
  label: string;
  requiresOs: boolean;
  requiresBrowser: boolean;
  isActive: boolean;
}

export interface BugDetailView {
  requestId: string;
  productVersion: string;
  expectedBehavior: string;
  observedBehavior: string;
  reproductionSteps: string;
  occurredAt: string;
  isRecurrent: boolean;
  frequencyLabel: string | null;
  environmentOs: string | null;
  environmentBrowser: string | null;
  environmentHardware: string | null;
  isBlocking: boolean;
  errorMessages: string | null;
  isReproduced: IsReproducedValue | null;
  rootCause: string | null;
  correctiveAction: string | null;
  workaround: string | null;
  fixDeployed: boolean | null;
  workaroundOnly: boolean | null;
  product: { id: string; code: string; label: string } | null;
}

export interface EvaluationView {
  requestId: string;
  score: number;
  comment: string | null;
  submittedAt: string;
}
