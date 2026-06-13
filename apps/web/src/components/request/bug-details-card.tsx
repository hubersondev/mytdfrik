import { Bug, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { IS_REPRODUCED_LABELS, type BugDetailView } from '@/lib/bug';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Affichage des détails structurés d'un bug (CDC §6.2). Montre la saisie Client
 * et, si renseigné, le diagnostic du Responsable. `showDiagnostic` masque le
 * diagnostic au Client tant qu'il n'est pas pertinent (il reste visible côté
 * interne).
 */
export function BugDetailsCard({
  bug,
  showDiagnostic = true,
}: {
  bug: BugDetailView;
  showDiagnostic?: boolean;
}) {
  const hasDiagnostic = Boolean(bug.isReproduced);
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 p-5 pb-3">
        <Bug className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Détails du bug
        </h2>
        {bug.isBlocking && <Badge variant="danger">Bloquant</Badge>}
        {bug.isRecurrent && <Badge variant="warning">Récurrent</Badge>}
      </div>
      <Separator />

      <dl className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <Field label="Produit">
          {bug.product ? `${bug.product.label} (${bug.product.code})` : '—'}
        </Field>
        <Field label="Version">{bug.productVersion}</Field>
        <Field label="Apparu le">{dateFmt.format(new Date(bug.occurredAt))}</Field>
        {bug.isRecurrent && <Field label="Fréquence">{bug.frequencyLabel ?? '—'}</Field>}
        {bug.environmentOs && <Field label="Système">{bug.environmentOs}</Field>}
        {bug.environmentBrowser && <Field label="Navigateur">{bug.environmentBrowser}</Field>}
        {bug.environmentHardware && <Field label="Matériel">{bug.environmentHardware}</Field>}
        <Field label="Comportement attendu" full>
          {bug.expectedBehavior}
        </Field>
        <Field label="Comportement observé" full>
          {bug.observedBehavior}
        </Field>
        <Field label="Étapes de reproduction" full>
          {bug.reproductionSteps}
        </Field>
        {bug.errorMessages && (
          <Field label="Messages d'erreur" full mono>
            {bug.errorMessages}
          </Field>
        )}
      </dl>

      {showDiagnostic && hasDiagnostic && (
        <>
          <Separator />
          <div className="flex items-center gap-2 p-5 pb-3">
            <ShieldCheck className="h-4 w-4 text-leaf-700 dark:text-leaf-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Diagnostic
            </h3>
          </div>
          <dl className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
            <Field label="Reproduction">
              {bug.isReproduced ? IS_REPRODUCED_LABELS[bug.isReproduced] : '—'}
            </Field>
            <Field label="Correctif">
              {bug.fixDeployed === true
                ? 'Déployé'
                : bug.workaroundOnly
                  ? 'Contournement seul'
                  : bug.fixDeployed === false
                    ? 'Non déployé'
                    : '—'}
            </Field>
            {bug.rootCause && (
              <Field label="Cause identifiée" full>
                {bug.rootCause}
              </Field>
            )}
            {bug.correctiveAction && (
              <Field label="Action corrective" full>
                {bug.correctiveAction}
              </Field>
            )}
            {bug.workaround && (
              <Field label="Contournement" full>
                {bug.workaround}
              </Field>
            )}
          </dl>
        </>
      )}
    </Card>
  );
}

function Field({
  label,
  children,
  full,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd
        className={`mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100 ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {children}
      </dd>
    </div>
  );
}
