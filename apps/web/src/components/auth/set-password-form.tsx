'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword } from '@/lib/password-policy';

export interface SetPasswordResult {
  error?: string;
}

interface Props {
  /** Jeton (activation ou réinitialisation) reçu par e-mail. */
  token: string;
  /** Action serveur : valide le jeton, pose le mot de passe, puis redirige. */
  action: (token: string, password: string) => Promise<SetPasswordResult | void>;
  submitLabel: string;
  pendingLabel: string;
}

/**
 * Formulaire de définition de mot de passe — partagé par l'activation de compte
 * et la réinitialisation. Validation de la politique côté client (miroir serveur)
 * + confirmation, puis appel de l'action serveur.
 */
export function SetPasswordForm({ token, action, submitLabel, pendingLabel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');

    const policyError = validatePassword(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await action(token, password);
      // En cas de succès, l'action redirige ; on n'arrive ici qu'en erreur.
      if (result?.error) setError(result.error);
    });
  }

  if (!token) {
    return (
      <p
        role="alert"
        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
      >
        Lien invalide : jeton manquant. Demandez un nouveau lien à votre administrateur.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          disabled={pending}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          12 caractères minimum, avec au moins 3 types parmi : minuscules, majuscules, chiffres,
          symboles.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Confirmer le mot de passe</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          disabled={pending}
        />
      </div>
      {error && (
        <p
          className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
