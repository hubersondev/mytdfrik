'use client';

import { AlertCircle, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileAction } from './actions';

interface Props {
  email: string;
  roleLabel: string;
  defaultValues: {
    firstName: string;
    lastName: string;
    phone: string;
    timeZone: string;
  };
}

const TIMEZONES = ['Africa/Abidjan', 'Africa/Lagos', 'Africa/Casablanca', 'Europe/Paris', 'UTC'];

const FIELD_CLASS =
  'mt-1 flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500/30 focus-visible:border-leaf-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950';

export function ProfileForm({ email, roleLabel, defaultValues }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(defaultValues.firstName);
  const [lastName, setLastName] = useState(defaultValues.lastName);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [timeZone, setTimeZone] = useState(defaultValues.timeZone);
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('idle');
    startTransition(async () => {
      const result = await updateProfileAction({ firstName, lastName, phone, timeZone });
      if (result.ok) {
        setStatus('saved');
        router.refresh();
      } else {
        setError(result.message ?? Object.values(result.fieldErrors ?? {})[0] ?? 'Échec.');
      }
    });
  };

  return (
    <Card className="flex flex-col">
      <form onSubmit={submit} className="flex flex-col gap-5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Informations personnelles
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <Label>Prénom</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="flex flex-col">
            <Label>Nom</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={120} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <Label>Adresse e-mail</Label>
            <Input value={email} disabled className="opacity-70" />
            <p className="mt-1 text-xs text-zinc-400">
              Contactez un administrateur pour modifier votre e-mail.
            </p>
          </div>
          <div className="flex flex-col">
            <Label>Rôle</Label>
            <Input value={roleLabel} disabled className="opacity-70" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <Label>Téléphone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              placeholder="+225 …"
            />
          </div>
          <div className="flex flex-col">
            <Label>Fuseau horaire</Label>
            <select
              className={FIELD_CLASS}
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            >
              {!TIMEZONES.includes(timeZone) && <option value={timeZone}>{timeZone}</option>}
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
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
            <span className="text-xs text-leaf-700 dark:text-leaf-400">Profil mis à jour.</span>
          )}
          <Button type="submit" disabled={pending} size="sm">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
