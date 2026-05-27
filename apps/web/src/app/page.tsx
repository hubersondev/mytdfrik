import { ApiHealthBadge } from '@/components/api-health-badge';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-24 dark:bg-zinc-950">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900">
          MyTDFRIK · MVP en cours
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Plateforme de gestion des demandes clients
        </h1>
        <p className="max-w-lg text-base text-zinc-600 dark:text-zinc-400">
          Point d&apos;entrée unique des sollicitations clients de TECHDIFRIK. Cycle de vie
          traçable, priorisation objective, suivi temps réel.
        </p>
      </div>

      <ApiHealthBadge />

      <footer className="text-xs text-zinc-500 dark:text-zinc-400">
        Sprint 0 — Setup &amp; socle · Référence projet CDC v0.3.1
      </footer>
    </main>
  );
}
