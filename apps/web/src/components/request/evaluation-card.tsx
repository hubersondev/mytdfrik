'use client';

import { Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { EvaluationView } from '@/lib/bug';
import { cn } from '@/lib/utils';

interface SubmitResult {
  ok: boolean;
  message?: string;
}

interface Props {
  reference: string;
  requestId: string;
  evaluation: EvaluationView | null;
  /** Le Client peut-il soumettre ? (propriétaire, demande clôturée, non encore évaluée) */
  canSubmit: boolean;
  action: (
    reference: string,
    requestId: string,
    score: number,
    comment: string,
  ) => Promise<SubmitResult>;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-4 w-4',
            n <= value
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-zinc-300 dark:text-zinc-600',
          )}
        />
      ))}
    </span>
  );
}

export function EvaluationCard({ reference, requestId, evaluation, canSubmit, action }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Rien à afficher si pas encore évaluable et pas d'évaluation existante.
  if (!evaluation && !canSubmit) return null;

  const submit = () => {
    if (score < 1) {
      setError('Sélectionnez une note de 1 à 5.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await action(reference, requestId, score, comment);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message ?? 'Échec de l’envoi.');
      }
    });
  };

  return (
    <Card className="flex flex-col">
      <div className="p-5 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Évaluation
        </h2>
      </div>
      <Separator />

      {evaluation ? (
        <div className="flex flex-col gap-2 p-5">
          <Stars value={evaluation.score} />
          {evaluation.comment && (
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {evaluation.comment}
            </p>
          )}
          <p className="text-xs text-zinc-400">Merci pour votre retour.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Votre demande est clôturée. Comment évaluez-vous sa prise en charge&nbsp;?
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    n <= (hover || score)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-zinc-300 dark:text-zinc-600',
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (optionnel)"
            className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
          />
          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <Button onClick={submit} disabled={pending} size="sm" className="self-end">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              'Envoyer mon évaluation'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
