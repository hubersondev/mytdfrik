'use client';

import { AlertCircle, Loader2, Lock, Send, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Avatar, AvatarFallback, initials } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { MessageView } from '@/lib/messages';
import { cn } from '@/lib/utils';
import { postMessageAction, withdrawMessageAction } from './actions';

interface Props {
  requestId: string;
  /** Chemin de la page à revalider après envoi/retrait. */
  revalidatePath: string;
  messages: MessageView[];
  /** Utilisateur courant (pour distinguer ses messages et autoriser le retrait). */
  currentUserId: string;
  /** L'utilisateur peut-il publier des messages internes ? (rôles internes) */
  canPostInternal: boolean;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export function MessageThread({
  requestId,
  revalidatePath,
  messages,
  currentUserId,
  canPostInternal,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    if (!body.trim()) {
      setError('Le message ne peut pas être vide.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await postMessageAction(requestId, revalidatePath, {
        body,
        isInternal: canPostInternal ? internal : false,
      });
      if (result.ok) {
        setBody('');
        setInternal(false);
        router.refresh();
      } else {
        setError(result.message ?? 'Échec de l’envoi.');
      }
    });
  };

  const withdraw = (messageId: string) => {
    const reason = window.prompt('Motif du retrait du message :');
    if (!reason || !reason.trim()) return;
    startTransition(async () => {
      const result = await withdrawMessageAction(messageId, revalidatePath, reason);
      if (!result.ok && result.message) window.alert(result.message);
      router.refresh();
    });
  };

  return (
    <Card className="flex flex-col">
      <div className="p-5 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Messagerie
        </h2>
      </div>
      <Separator />

      <ul className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto p-5">
        {messages.map((m) => {
          const mine = m.author?.id === currentUserId;
          return (
            <li key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    'text-[10px] font-semibold',
                    m.isInternal
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-leaf-100 text-leaf-700 dark:bg-leaf-950 dark:text-leaf-300',
                  )}
                >
                  {m.author ? initials(m.author.firstName, m.author.lastName) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className={cn('max-w-[80%]', mine && 'items-end text-right')}>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {m.author ? `${m.author.firstName} ${m.author.lastName}` : 'Inconnu'}
                  </span>
                  {m.isInternal && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <Lock className="h-2.5 w-2.5" />
                      Interne
                    </span>
                  )}
                  <span>{dateFmt.format(new Date(m.createdAt))}</span>
                </div>
                <div
                  className={cn(
                    'mt-1 inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
                    m.isWithdrawn
                      ? 'italic text-zinc-400 dark:text-zinc-500'
                      : m.isInternal
                        ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                        : mine
                          ? 'bg-leaf-700 text-white'
                          : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
                  )}
                >
                  {m.body}
                </div>
                {mine && !m.isWithdrawn && (
                  <div>
                    <button
                      type="button"
                      onClick={() => withdraw(m.id)}
                      disabled={pending}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Undo2 className="h-3 w-3" />
                      Retirer
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {messages.length === 0 && (
          <li className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Aucun message pour l&apos;instant.
          </li>
        )}
      </ul>

      <Separator />
      <div className="flex flex-col gap-2 p-5">
        <textarea
          rows={3}
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrire un message…"
          className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
        />
        {error && (
          <p className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          {canPostInternal ? (
            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 dark:border-zinc-700"
              />
              Message interne (non visible du client)
            </label>
          ) : (
            <span />
          )}
          <Button onClick={send} disabled={pending} size="sm">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
