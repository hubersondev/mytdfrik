import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Connexion · MyTDFRIK',
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/admin');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900">
            MyTDFRIK
          </span>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Connexion</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Identifiez-vous pour accéder à la plateforme.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
