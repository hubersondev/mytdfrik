import Link from 'next/link';
import { SetPasswordForm } from '@/components/auth/set-password-form';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getTheme } from '@/lib/theme';
import { resetPasswordConfirmAction } from './actions';

export const metadata = { title: 'Réinitialiser le mot de passe · MyTDFRIK' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const theme = await getTheme();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sand-50 via-white to-leaf-50/60 px-4 dark:from-zinc-950 dark:via-zinc-950 dark:to-leaf-950/20">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-leaf-300/20 blur-3xl dark:bg-leaf-800/20" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-900/20" />
      <div className="absolute right-4 top-4">
        <ThemeToggle current={theme} />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <Logo size={32} priority />
          <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            MyTDFRIK
          </span>
        </Link>

        <Card className="p-8 shadow-soft-lg">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <Badge variant="outline">Réinitialisation</Badge>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Définissez un nouveau mot de passe pour votre compte.
            </p>
          </div>

          <SetPasswordForm
            token={token ?? ''}
            action={resetPasswordConfirmAction}
            submitLabel="Réinitialiser le mot de passe"
            pendingLabel="Réinitialisation…"
          />
        </Card>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
          <Link href="/login" className="text-leaf-700 hover:underline dark:text-leaf-400">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
