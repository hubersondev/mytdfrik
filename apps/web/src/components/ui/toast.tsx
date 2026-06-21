'use client';

import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

type ToastFn = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ToastFn | null>(null);

/** Hook : `const toast = useToast(); toast('Enregistré', 'success');`. */
export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé dans un <ToastProvider>.');
  }
  return ctx;
}

const AUTO_DISMISS_MS = 5000;

const TONE_STYLES: Record<ToastTone, { border: string; icon: ReactNode }> = {
  success: {
    border: 'border-l-emerald-500',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  },
  error: {
    border: 'border-l-rose-500',
    icon: <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
  },
  info: {
    border: 'border-l-leaf-500',
    icon: <Info className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />,
  },
};

/**
 * Fournit des notifications éphémères (toasts) stylées — remplace `window.alert`.
 * À placer haut dans l'arbre ; les composants appellent `useToast()`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    (message, tone = 'info') => {
      const id = (counter.current += 1);
      setToasts((current) => [...current, { id, message, tone }]);
      // Auto-fermeture (dans un callback différé, jamais pendant le rendu).
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 border-zinc-200 bg-white px-4 py-3 shadow-soft-lg dark:border-zinc-800 dark:bg-zinc-900',
              TONE_STYLES[t.tone].border,
            )}
          >
            <span className="mt-0.5 shrink-0">{TONE_STYLES[t.tone].icon}</span>
            <p className="min-w-0 flex-1 text-sm text-zinc-800 dark:text-zinc-100">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Fermer la notification"
              className="-mr-1 shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
