'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type LoginActionState } from './actions';

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Adresse courriel</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="nom@entreprise.com"
          disabled={pending}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          disabled={pending}
        />
      </div>
      {state.error && (
        <p
          className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
          role="alert"
          aria-live="polite"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  );
}
