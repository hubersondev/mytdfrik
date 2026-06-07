'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { priorityLabel, type PriorityCode, type RequestStatus } from '@/lib/requests';
import { transitionUi } from '@/lib/transitions';
import { cn } from '@/lib/utils';
import { applyTransitionAction } from '../actions';

interface AssigneeOption {
  id: string;
  label: string;
}

interface Props {
  reference: string;
  requestId: string;
  currentStatus: RequestStatus;
  /** Codes de transitions applicables (depuis l'API). */
  codes: string[];
  /** Responsables affectables (pour T06). */
  assignees: AssigneeOption[];
}

const PRIORITIES: PriorityCode[] = ['P0', 'P1', 'P2', 'P3', 'P4'];

const FIELD_CLASS =
  'mt-1 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-100';

export function TransitionPanel({ reference, requestId, currentStatus, codes, assignees }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<PriorityCode | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  if (codes.length === 0) {
    return (
      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Actions
        </h2>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Aucune action disponible sur cette demande pour votre rôle à ce stade.
        </p>
      </Card>
    );
  }

  const reset = () => {
    setActive(null);
    setNote('');
    setAssigneeId('');
    setPriority('');
    setError(null);
  };

  const open = (code: string) => {
    reset();
    setActive(code);
  };

  const submit = () => {
    if (!active) return;
    const ui = transitionUi(active);
    if (ui.requiresNote && !note.trim()) {
      setError('Un motif ou message est obligatoire.');
      return;
    }
    if (ui.needsAssignee && !assigneeId) {
      setError('Sélectionnez un responsable.');
      return;
    }
    setError(null);
    startSubmit(async () => {
      const result = await applyTransitionAction(reference, requestId, active, {
        expectedStatus: currentStatus,
        note: note.trim() || undefined,
        assigneeId: ui.needsAssignee ? assigneeId : undefined,
        effectivePriorityId: ui.allowsPriority && priority ? priority : undefined,
      });
      if (result.ok) {
        reset();
        router.refresh();
      } else {
        setError(result.message ?? 'Échec de l’action.');
      }
    });
  };

  const activeUi = active ? transitionUi(active) : null;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Actions
      </h2>

      {!active && (
        <div className="flex flex-col gap-2">
          {codes.map((code) => {
            const ui = transitionUi(code);
            return (
              <Button
                key={code}
                variant={ui.tone}
                className="justify-start"
                onClick={() => open(code)}
              >
                {ui.cta}
              </Button>
            );
          })}
        </div>
      )}

      {active && activeUi && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{activeUi.label}</p>

          {activeUi.needsAssignee && (
            <div>
              <Label>Responsable</Label>
              <select
                className={FIELD_CLASS}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Sélectionnez un responsable…</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              {assignees.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  Aucun utilisateur interne disponible.
                </p>
              )}
            </div>
          )}

          {activeUi.allowsPriority && (
            <div>
              <Label>Priorité (laisser inchangée ou ajuster)</Label>
              <select
                className={FIELD_CLASS}
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityCode | '')}
              >
                <option value="">— Conserver la priorité système —</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel(p)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeUi.noteLabel && (
            <div>
              <Label>{activeUi.noteLabel}</Label>
              <textarea
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
                placeholder={activeUi.requiresNote ? 'Obligatoire' : 'Optionnel'}
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={reset} disabled={submitting}>
              Annuler
            </Button>
            <Button variant={activeUi.tone} onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  En cours…
                </>
              ) : (
                <span className={cn(activeUi.tone === 'destructive' && 'font-medium')}>
                  Confirmer
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
