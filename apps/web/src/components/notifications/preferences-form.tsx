'use client';

import { Loader2, Lock } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PreferenceMap } from '@/lib/notifications';
import { updatePreferencesAction } from './actions';

interface CategoryDef {
  key: string;
  label: string;
}

/**
 * Réglage des canaux (in-app / e-mail) par catégorie d'événement
 * (CDC §7.6 [EXG-07-070]). Les notifications critiques [EXG-07-080] ne sont
 * pas listées ici : elles restent toujours actives.
 */
export function PreferencesForm({
  categories,
  initial,
}: {
  categories: CategoryDef[];
  initial: PreferenceMap;
}) {
  const enabled = (cat: string, ch: 'IN_APP' | 'EMAIL'): boolean => initial[cat]?.[ch] !== false;

  const [prefs, setPrefs] = useState<PreferenceMap>(() => {
    const seed: PreferenceMap = {};
    for (const c of categories) {
      seed[c.key] = { IN_APP: enabled(c.key, 'IN_APP'), EMAIL: enabled(c.key, 'EMAIL') };
    }
    return seed;
  });
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [pending, startTransition] = useTransition();

  const toggle = (cat: string, ch: 'IN_APP' | 'EMAIL') => {
    setStatus('idle');
    setPrefs((p) => ({ ...p, [cat]: { ...p[cat], [ch]: !p[cat]?.[ch] } }));
  };

  const save = () => {
    startTransition(async () => {
      const result = await updatePreferencesAction(prefs);
      setStatus(result.ok ? 'saved' : 'error');
    });
  };

  return (
    <Card className="flex flex-col">
      <div className="p-5 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Canaux par type de notification
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Choisissez comment être prévenu. Les alertes de sécurité restent toujours activées.
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-1 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        <span>Catégorie</span>
        <span className="text-center">Dans l&apos;app</span>
        <span className="text-center">E-mail</span>
      </div>
      <Separator />

      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
        {categories.map((c) => (
          <div
            key={c.key}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-5 py-3"
          >
            <span className="text-sm text-zinc-800 dark:text-zinc-200">{c.label}</span>
            <Toggle
              checked={prefs[c.key]?.IN_APP ?? true}
              onChange={() => toggle(c.key, 'IN_APP')}
              label={`Notifications in-app — ${c.label}`}
            />
            <Toggle
              checked={prefs[c.key]?.EMAIL ?? true}
              onChange={() => toggle(c.key, 'EMAIL')}
              label={`E-mails — ${c.label}`}
            />
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-6 px-5 py-3">
          <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Lock className="h-3.5 w-3.5" />
            Sécurité du compte
          </span>
          <span className="text-xs italic text-zinc-400">Toujours activé</span>
        </div>
      </div>

      <Separator />
      <div className="flex items-center justify-end gap-3 p-5">
        {status === 'saved' && (
          <span className="text-xs text-leaf-700 dark:text-leaf-400">
            Préférences enregistrées.
          </span>
        )}
        {status === 'error' && (
          <span className="text-xs text-rose-600 dark:text-rose-400">
            Échec de l’enregistrement.
          </span>
        )}
        <Button onClick={save} disabled={pending} size="sm">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
    </Card>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-self-center rounded-full transition-colors ${
        checked ? 'bg-leaf-600' : 'bg-zinc-300 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
