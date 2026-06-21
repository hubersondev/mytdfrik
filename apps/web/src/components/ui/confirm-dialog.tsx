'use client';

import { AlertTriangle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  /** Titre du modal (par défaut « Confirmation »). */
  title?: string;
  /** Message principal. */
  description: string;
  /** Libellé du bouton de confirmation (par défaut « Confirmer »). */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation (par défaut « Annuler »). */
  cancelLabel?: string;
  /** « danger » colore le bouton de confirmation en rouge (suppression). */
  tone?: 'default' | 'danger';
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Hook : `const confirm = useConfirm(); if (await confirm({...})) { … }`. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm doit être utilisé dans un <ConfirmProvider>.');
  }
  return ctx;
}

interface PendingState {
  opts: ConfirmOptions;
  resolve: (value: boolean) => void;
}

/**
 * Fournit un modal de confirmation stylé (remplace `window.confirm`).
 * À placer haut dans l'arbre (layout). Les composants appellent `useConfirm()`.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (opts) => new Promise<boolean>((resolve) => setPending({ opts, resolve })),
    [],
  );

  const close = useCallback((result: boolean) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  // Échap = annuler tant que le modal est ouvert.
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, close]);

  const danger = pending?.opts.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
            >
              <button
                type="button"
                aria-label="Fermer"
                onMouseDown={() => close(false)}
                className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
              />
              <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-soft-lg dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-3 p-5">
                  <span
                    className={cn(
                      'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full',
                      danger
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                        : 'bg-leaf-100 text-leaf-700 dark:bg-leaf-950/50 dark:text-leaf-300',
                    )}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="confirm-title"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                      {pending.opts.title ?? 'Confirmation'}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {pending.opts.description}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-zinc-200/80 bg-zinc-50/60 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {pending.opts.cancelLabel ?? 'Annuler'}
                  </button>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => close(true)}
                    className={cn(
                      'rounded-md px-3.5 py-2 text-sm font-medium text-white transition-colors',
                      danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-leaf-700 hover:bg-leaf-800',
                    )}
                  >
                    {pending.opts.confirmLabel ?? 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}
