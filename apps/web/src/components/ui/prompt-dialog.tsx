'use client';

import { MessageSquareText } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PromptOptions {
  /** Titre du modal. */
  title?: string;
  /** Texte explicatif au-dessus du champ. */
  description?: string;
  /** Libellé du champ. */
  label?: string;
  placeholder?: string;
  /** Valeur initiale. */
  defaultValue?: string;
  /** Libellé du bouton de validation (par défaut « Valider »). */
  confirmLabel?: string;
  /** Saisie obligatoire : le bouton reste désactivé tant que le champ est vide. */
  required?: boolean;
  /** Zone de texte multi-lignes (par défaut true — adapté aux motifs). */
  multiline?: boolean;
}

type PromptFn = (opts: PromptOptions) => Promise<string | null>;

const PromptContext = createContext<PromptFn | null>(null);

/** Hook : `const ask = usePrompt(); const v = await ask({...}); if (v) {…}`. */
export function usePrompt(): PromptFn {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error('usePrompt doit être utilisé dans un <PromptProvider>.');
  }
  return ctx;
}

interface PendingState {
  opts: PromptOptions;
  resolve: (value: string | null) => void;
}

/**
 * Modal de saisie texte (remplace `window.prompt`). Résout avec la valeur
 * saisie, ou `null` si annulé. À placer haut dans l'arbre (layout).
 */
export function PromptProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);
  const [value, setValue] = useState('');

  const prompt = useCallback<PromptFn>(
    (opts) =>
      new Promise<string | null>((resolve) => {
        setValue(opts.defaultValue ?? '');
        setPending({ opts, resolve });
      }),
    [],
  );

  const close = useCallback((result: string | null) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, close]);

  const opts = pending?.opts;
  const multiline = opts?.multiline ?? true;
  const canSubmit = !opts?.required || value.trim().length > 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    close(value);
  }

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      {pending && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="prompt-title"
            >
              <button
                type="button"
                aria-label="Fermer"
                onMouseDown={() => close(null)}
                className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
              />
              <form
                onSubmit={submit}
                className="relative w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-soft-lg dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start gap-3 p-5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-100 text-leaf-700 dark:bg-leaf-950/50 dark:text-leaf-300">
                    <MessageSquareText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="prompt-title"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                      {opts?.title ?? 'Saisie'}
                    </h2>
                    {opts?.description && (
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {opts.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-col gap-1.5">
                      {opts?.label && (
                        <label
                          htmlFor="prompt-input"
                          className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          {opts.label}
                          {opts.required && <span className="text-rose-500"> *</span>}
                        </label>
                      )}
                      {multiline ? (
                        <textarea
                          id="prompt-input"
                          autoFocus
                          rows={3}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder={opts?.placeholder}
                          className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:border-leaf-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
                        />
                      ) : (
                        <input
                          id="prompt-input"
                          autoFocus
                          type="text"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder={opts?.placeholder}
                          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:border-leaf-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-zinc-200/80 bg-zinc-50/60 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <button
                    type="button"
                    onClick={() => close(null)}
                    className="rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-md bg-leaf-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {opts?.confirmLabel ?? 'Valider'}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}
    </PromptContext.Provider>
  );
}
