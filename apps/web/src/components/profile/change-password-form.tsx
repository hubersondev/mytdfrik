'use client';

import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { changePasswordAction } from './actions';

/** Au moins 3 des 4 classes de caractères (aligné sur la politique serveur). */
function passwordClasses(pw: string): number {
  return [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('idle');
    if (next.length < 8) {
      setError('Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (passwordClasses(next) < 3) {
      setError('Au moins 3 classes : minuscules, majuscules, chiffres, caractères spéciaux.');
      return;
    }
    if (next !== confirm) {
      setError('La confirmation ne correspond pas.');
      return;
    }
    startTransition(async () => {
      const result = await changePasswordAction({ currentPassword: current, newPassword: next });
      if (result.ok) {
        setStatus('saved');
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        setError(result.message ?? Object.values(result.fieldErrors ?? {})[0] ?? 'Échec.');
      }
    });
  };

  return (
    <Card className="flex flex-col">
      <form onSubmit={submit} className="flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Mot de passe
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Minimum 8 caractères, au moins 3 classes (minuscules, majuscules, chiffres, spéciaux).
          </p>
        </div>

        <div className="flex flex-col">
          <Label>Mot de passe actuel</Label>
          <PasswordInput
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <Label>Nouveau mot de passe</Label>
            <PasswordInput
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label>Confirmer</Label>
            <PasswordInput
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          {status === 'saved' && !error && (
            <span className="text-xs text-leaf-700 dark:text-leaf-400">Mot de passe modifié.</span>
          )}
          <Button type="submit" disabled={pending || !current || !next || !confirm} size="sm">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Modification…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Changer le mot de passe
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
