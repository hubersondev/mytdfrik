'use client';

import { AlertCircle, Loader2, Stethoscope } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { BugDetailView, IsReproducedValue } from '@/lib/bug';
import { IS_REPRODUCED_LABELS } from '@/lib/bug';
import { submitDiagnosticAction } from '@/app/admin/requests/actions';

const FIELD_CLASS =
  'mt-1 flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-100';

const REPRODUCED_OPTIONS: IsReproducedValue[] = ['OUI', 'NON', 'PARTIEL', 'NON_TESTE'];

/**
 * Panneau de diagnostic du Responsable (CDC §6.3.2). À renseigner avant de
 * proposer une résolution (T11) — le moteur refuse T11 sans diagnostic.
 */
export function BugDiagnosticPanel({
  reference,
  requestId,
  bug,
}: {
  reference: string;
  requestId: string;
  bug: BugDetailView;
}) {
  const router = useRouter();
  const [isReproduced, setIsReproduced] = useState<IsReproducedValue | ''>(bug.isReproduced ?? '');
  const [rootCause, setRootCause] = useState(bug.rootCause ?? '');
  const [correctiveAction, setCorrectiveAction] = useState(bug.correctiveAction ?? '');
  const [workaround, setWorkaround] = useState(bug.workaround ?? '');
  const [fixDeployed, setFixDeployed] = useState(bug.fixDeployed ?? false);
  const [workaroundOnly, setWorkaroundOnly] = useState(bug.workaroundOnly ?? false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!isReproduced) {
      setError('Indiquez le résultat de reproduction.');
      return;
    }
    if (rootCause.trim().length < 3 || correctiveAction.trim().length < 3) {
      setError('Renseignez la cause et l’action corrective (au moins 3 caractères).');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitDiagnosticAction(reference, requestId, {
        isReproduced,
        rootCause: rootCause.trim(),
        correctiveAction: correctiveAction.trim(),
        workaround: workaround.trim() || undefined,
        fixDeployed,
        workaroundOnly,
      });
      if (result.ok) {
        setOk(true);
        router.refresh();
      } else {
        setError(result.message ?? 'Échec de l’enregistrement.');
      }
    });
  };

  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <Stethoscope className="h-4 w-4" />
        Diagnostic
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        À consigner avant de proposer une résolution (CDC §6.3.2).
      </p>

      <div>
        <Label>Reproduction</Label>
        <select
          className={FIELD_CLASS}
          value={isReproduced}
          onChange={(e) => setIsReproduced(e.target.value as IsReproducedValue | '')}
        >
          <option value="">Sélectionnez…</option>
          {REPRODUCED_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {IS_REPRODUCED_LABELS[v]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Cause identifiée</Label>
        <textarea
          rows={2}
          maxLength={3000}
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <Label>Action corrective</Label>
        <textarea
          rows={2}
          maxLength={3000}
          value={correctiveAction}
          onChange={(e) => setCorrectiveAction(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <Label>Contournement (optionnel)</Label>
        <textarea
          rows={2}
          maxLength={2000}
          value={workaround}
          onChange={(e) => setWorkaround(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            checked={fixDeployed}
            onChange={(e) => setFixDeployed(e.target.checked)}
          />
          Correctif déployé
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            checked={workaroundOnly}
            onChange={(e) => setWorkaroundOnly(e.target.checked)}
          />
          Contournement seul
        </label>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {ok && !error && (
        <p className="text-xs text-leaf-700 dark:text-leaf-400">Diagnostic enregistré.</p>
      )}

      <Button onClick={submit} disabled={pending} size="sm" className="self-end">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement…
          </>
        ) : (
          'Enregistrer le diagnostic'
        )}
      </Button>
    </Card>
  );
}
