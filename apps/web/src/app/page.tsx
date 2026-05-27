import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ApiHealthBadge } from '@/components/api-health-badge';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTheme } from '@/lib/theme';

export default async function Home() {
  const theme = await getTheme();
  return (
    <main className="relative flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200/60 px-6 py-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-3">
          <Logo size={28} priority />
          <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            MyTDFRIK · MVP
          </span>
        </div>
        <ThemeToggle current={theme} />
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <Badge variant="outline">Sprint 2 · Catalogue &amp; Administration</Badge>

        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Plateforme de gestion des demandes clients
        </h1>
        <p className="max-w-xl text-balance text-base text-zinc-600 dark:text-zinc-400">
          Point d&apos;entrée unique des sollicitations clients de TECHDIFRIK. Cycle de vie
          traçable, priorisation objective inspirée ITIL, suivi temps réel.
        </p>

        <div className="flex flex-col items-center gap-4">
          <ApiHealthBadge />
          <Button asChild size="lg">
            <Link href="/login">
              Accéder à la plateforme
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-zinc-200/60 px-6 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-500">
        Référence projet CDC v0.3.1 · MyTDFRIK · TECHDIFRIK © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
