import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getSession } from '@/lib/auth';
import { getTheme } from '@/lib/theme';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Connexion · MyTDFRIK',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; denied?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (session && !params.expired) {
    redirect('/admin');
  }
  const theme = await getTheme();

  const notice = params.expired
    ? 'Votre session a expiré. Veuillez vous reconnecter.'
    : params.denied === 'role'
      ? "Votre rôle ne permet pas d'accéder à cet espace."
      : null;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle current={theme} />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <Logo size={32} priority />
          <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            MyTDFRIK
          </span>
        </Link>

        <Card className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <Badge variant="outline">Connexion</Badge>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Bon retour
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Identifiez-vous pour accéder à la plateforme.
            </p>
          </div>

          {notice && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
            >
              {notice}
            </div>
          )}

          <LoginForm />
        </Card>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
          Problème d&apos;accès ? Contactez votre administrateur.
        </p>
      </div>
    </main>
  );
}
