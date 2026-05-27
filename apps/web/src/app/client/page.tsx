import { Bug, Clock, PlusCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiFetchOr } from '@/lib/api';
import { getSession } from '@/lib/auth';
import {
  formatDurationMinutes,
  priorityShortLabel,
  type PriorityCode,
  type RequestSummary,
} from '@/lib/requests';
import { cn } from '@/lib/utils';
import { bucketKeyFromQuery } from './_components/filter-buckets';
import { FilterMenu } from './_components/filter-menu';
import { RequestRow } from './_components/request-row';
import { SortMenu } from './_components/sort-menu';
import { DEFAULT_SORT, SORT_OPTIONS, sortKeyFromQuery } from './_components/sort-options';

interface CursorPage<T> {
  items: T[];
  page_info: { has_next: boolean; next_cursor: string | null };
}

interface PriorityLevel {
  id: PriorityCode;
  label: string;
  slaFirstResponseMinutes: number;
  slaResolutionMinutes: number;
  is24x7: boolean;
}

/** Statuts considérés "ouverts" du point de vue Client (CDC §4.1). */
const OPEN_STATUSES = new Set([
  'NOUVELLE',
  'EN_ATTENTE_AFFECTATION',
  'AFFECTEE',
  'EN_COURS',
  'EN_ATTENTE_CLIENT',
]);

/** Statuts terminaux comptés comme "résolues" (RESOLUE + CLOTUREE). */
const RESOLVED_STATUSES = new Set(['RESOLUE', 'CLOTUREE']);

export default async function ClientHomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const session = await getSession();
  const firstName = session?.user.firstName ?? '';
  const params = await searchParams;
  const bucket = bucketKeyFromQuery(params.status);
  const sort = sortKeyFromQuery(params.sort);
  const listQs = new URLSearchParams({ limit: '50' });
  if (params.status) listQs.set('status', params.status);
  if (sort !== DEFAULT_SORT) listQs.set('sort', sort);
  const listQuery = `/requests?${listQs.toString()}`;

  // Compteurs du bandeau et tuiles stats : toujours sur la totalité des
  // demandes du Client (indépendants du filtre visuel de la liste).
  const [page, filteredPage, priorities] = await Promise.all([
    apiFetchOr<CursorPage<RequestSummary>>('/requests?limit=50', {
      items: [],
      page_info: { has_next: false, next_cursor: null },
    }),
    apiFetchOr<CursorPage<RequestSummary>>(listQuery, {
      items: [],
      page_info: { has_next: false, next_cursor: null },
    }),
    apiFetchOr<PriorityLevel[]>('/priority-levels', []),
  ]);

  const openCount = page.items.filter((r) => OPEN_STATUSES.has(r.status)).length;
  const waitingClientCount = page.items.filter((r) => r.status === 'EN_ATTENTE_CLIENT').length;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const resolvedThisMonth = page.items.filter(
    (r) => RESOLVED_STATUSES.has(r.status) && new Date(r.updatedAt) >= startOfMonth,
  ).length;

  // L'API a déjà appliqué le tri ; on garde l'ordre tel quel et on n'expose
  // que les 6 premières lignes dans la carte "Mes demandes" du dashboard.
  const recent = filteredPage.items.slice(0, 6);

  // Tri P0 → P3 et exclusion du P4 dans la carte SLA (rarement utile au Client).
  const sortedPriorities = [...priorities]
    .filter((p) => p.id !== 'P4')
    .sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="flex flex-col gap-6">
      <WelcomeHero
        firstName={firstName}
        openCount={openCount}
        waitingClientCount={waitingClientCount}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Demandes ouvertes"
          value={openCount.toString()}
          delta={
            openCount > 0
              ? { tone: 'leaf', text: `dont ${waitingClientCount} en attente de vous` }
              : { tone: 'neutral', text: 'aucune en cours' }
          }
        />
        <StatTile
          label="Délai moyen de réponse"
          value="—"
          delta={{ tone: 'neutral', text: 'disponible au Sprint 5' }}
        />
        <StatTile
          label="Satisfaction moyenne"
          value="—"
          delta={{ tone: 'neutral', text: 'disponible au Sprint 7' }}
        />
        <StatTile
          label="Résolues ce mois"
          value={resolvedThisMonth.toString()}
          delta={{
            tone: resolvedThisMonth > 0 ? 'leaf' : 'neutral',
            text: 'depuis le 1er du mois',
          }}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3 p-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Mes demandes
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {filteredPage.items.length === 0
                  ? bucket === 'ALL'
                    ? 'Aucun dossier'
                    : 'Aucune demande pour ce filtre'
                  : `${filteredPage.items.length} dossier${filteredPage.items.length > 1 ? 's' : ''} — ${SORT_OPTIONS[sort].inline}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <FilterMenu current={bucket} />
              <SortMenu current={sort} />
            </div>
          </div>
          <Separator />
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {recent.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
            {recent.length === 0 && bucket === 'ALL' && (
              <li className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Vous n&apos;avez pas encore soumis de demande.{' '}
                <Link
                  href="/client/requests/new"
                  className="font-medium text-leaf-700 hover:underline dark:text-leaf-400"
                >
                  Lancez-vous avec votre première demande
                </Link>
                .
              </li>
            )}
            {recent.length === 0 && bucket !== 'ALL' && (
              <li className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Aucune demande ne correspond à ce filtre.{' '}
                <Link
                  href="/client"
                  scroll={false}
                  className="font-medium text-leaf-700 hover:underline dark:text-leaf-400"
                >
                  Réinitialiser
                </Link>
                .
              </li>
            )}
          </ul>
          {filteredPage.items.length > recent.length && (
            <>
              <Separator />
              <div className="flex items-center justify-end p-3">
                <Link
                  href={
                    params.status
                      ? `/client/requests?status=${encodeURIComponent(params.status)}`
                      : '/client/requests'
                  }
                  className="text-xs font-medium text-leaf-700 hover:underline dark:text-leaf-400"
                >
                  Voir toutes les demandes →
                </Link>
              </div>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <SlaCard priorities={sortedPriorities} />
          <FallbackChannelCard />
        </div>
      </section>
    </div>
  );
}

function WelcomeHero({
  firstName,
  openCount,
  waitingClientCount,
}: {
  firstName: string;
  openCount: number;
  waitingClientCount: number;
}) {
  const greeting = firstName ? firstName.toUpperCase() : 'BIENVENUE';
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-leaf-700 px-6 py-8 text-white shadow-sm dark:bg-leaf-800 sm:px-10 sm:py-10">
      {/* Cercles décoratifs (identité TECHDIFRIK — silhouette de l'Afrique stylisée). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-leaf-600/50"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 bottom-0 -z-10 h-40 w-40 translate-y-1/3 rounded-full bg-sand-500/25"
      />

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-leaf-100">
        Bonjour, {greeting}
      </p>
      <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-[2.1rem]">
        Vous avez{' '}
        <span className="text-sand-300">
          {openCount} demande{openCount > 1 ? 's' : ''} en cours
        </span>
        {waitingClientCount > 0 ? (
          <>
            {' '}et{' '}
            <span className="text-sand-300">
              {waitingClientCount} réponse{waitingClientCount > 1 ? 's' : ''} de votre interlocuteur
            </span>
            .
          </>
        ) : (
          '.'
        )}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-leaf-50/90 sm:text-base">
        Toutes vos sollicitations auprès de TECHDIFRIK transitent désormais ici. Suivi en temps
        réel, historique complet, échanges centralisés.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="brand" size="lg">
          <Link href="/client/requests/new">
            <PlusCircle className="h-4 w-4" />
            Nouvelle demande
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-white/40 bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white dark:border-white/30 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
        >
          <Link href="/client/requests/new?type=bug">
            <Bug className="h-4 w-4" />
            Signaler un bug
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: { tone: 'leaf' | 'danger' | 'neutral'; text: string };
}) {
  return (
    <Card>
      <div className="flex flex-col gap-1.5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
        <p
          className={cn(
            'text-xs font-medium',
            delta.tone === 'leaf' && 'text-leaf-700 dark:text-leaf-400',
            delta.tone === 'danger' && 'text-rose-600 dark:text-rose-400',
            delta.tone === 'neutral' && 'text-zinc-500 dark:text-zinc-400',
          )}
        >
          {delta.text}
        </p>
      </div>
    </Card>
  );
}

function SlaCard({ priorities }: { priorities: PriorityLevel[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5 p-5 pb-3">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-sand-100 text-sand-800 dark:bg-sand-950/60 dark:text-sand-300">
          <Clock className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Engagements de service
        </h2>
      </div>
      <ul className="px-5 pb-5">
        {priorities.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 border-t border-zinc-100 py-2.5 text-sm first:border-t-0 dark:border-zinc-800/60"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'inline-flex h-5 items-center rounded px-1.5 text-[10px] font-bold uppercase tracking-wider',
                  p.id === 'P0' && 'bg-rose-600 text-white',
                  p.id === 'P1' && 'bg-amber-500 text-white',
                  p.id === 'P2' && 'bg-amber-400 text-amber-950',
                  p.id === 'P3' && 'bg-leaf-600 text-white',
                  p.id === 'P4' && 'bg-zinc-400 text-white',
                )}
              >
                {p.id}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {priorityShortLabel(p.id)}
              </span>
            </div>
            <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
              {formatDurationMinutes(p.slaFirstResponseMinutes)} ·{' '}
              {formatDurationMinutes(p.slaResolutionMinutes)}
            </span>
          </li>
        ))}
        {priorities.length === 0 && (
          <li className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Référentiel SLA indisponible.
          </li>
        )}
      </ul>
    </Card>
  );
}

function FallbackChannelCard() {
  return (
    <Card>
      <div className="flex items-start gap-3 p-5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Canal de secours
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            En cas d&apos;indisponibilité de la plateforme, écrivez à{' '}
            <a
              href="mailto:support@techdifrik.com"
              className="font-mono text-leaf-700 hover:underline dark:text-leaf-400"
            >
              support@techdifrik.com
            </a>{' '}
            ou consultez{' '}
            <a
              href="https://status.techdifrik.com"
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-leaf-700 hover:underline dark:text-leaf-400"
            >
              status.techdifrik.com
            </a>
            .
          </p>
        </div>
      </div>
    </Card>
  );
}
