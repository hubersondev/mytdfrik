import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  LayoutDashboard,
  Loader2,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiFetchOr } from '@/lib/api';
import { formatMinutes, type OperationalMetrics, type StrategicMetrics } from '@/lib/metrics';
import { priorityLabel, type PriorityCode } from '@/lib/requests';

export const metadata = { title: 'Tableau de bord · MyTDFRIK' };

const PERIODS = [
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
  { days: 365, label: '12 mois' },
] as const;

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { period } = await searchParams;
  const days = PERIODS.some((p) => String(p.days) === period) ? Number(period) : 30;
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const qs = `from=${from.toISOString()}&to=${to.toISOString()}`;

  const [op, strat] = await Promise.all([
    apiFetchOr<OperationalMetrics | null>('/metrics/operational', null),
    apiFetchOr<StrategicMetrics | null>(`/metrics/strategic?${qs}`, null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Tableau de bord
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pilotage de l&apos;activité
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
          {PERIODS.map((p) => {
            const active = p.days === days;
            return (
              <Link
                key={p.days}
                href={`/admin?period=${p.days}`}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-leaf-700 text-white dark:bg-leaf-600'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Compteurs opérationnels (CDC §3.11.1 [EXG-03-091]) */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Counter label="En cours" value={op?.enCours ?? 0} icon={Loader2} tone="leaf" />
        <Counter
          label="En attente client"
          value={op?.enAttenteClient ?? 0}
          icon={Clock}
          tone="amber"
        />
        <Counter
          label="En retard SLA"
          value={op?.enRetardSla ?? 0}
          icon={AlertTriangle}
          tone="rose"
        />
        <Counter label="À clôturer" value={op?.aCloturer ?? 0} icon={CheckCircle2} tone="zinc" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charge par responsable (CDC §3.11.1 [EXG-03-092]) */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 p-5 pb-3">
            <Users className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Charge par responsable
            </h2>
          </div>
          <Separator />
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {(op?.chargeResponsables ?? []).map((r) => (
              <li key={r.userId} className="flex items-center justify-between px-5 py-3">
                <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">{r.name}</span>
                <span className="flex items-center gap-2 text-xs">
                  <Badge variant="leaf">{r.actives} actives</Badge>
                  <span className="text-zinc-400">{r.resolues} résolues</span>
                </span>
              </li>
            ))}
            {(op?.chargeResponsables ?? []).length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Aucune demande affectée.
              </li>
            )}
          </ul>
        </Card>

        {/* Indicateurs stratégiques (CDC §3.11.2 [EXG-03-100]) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Indicateurs · {PERIODS.find((p) => p.days === days)?.label}
            </h2>
            <Link
              href={`/admin/metrics/export?${qs}`}
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Link>
          </div>
          <Separator />
          <dl className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <Stat label="Demandes reçues" value={strat?.volume.recues ?? 0} />
            <Stat label="Résolues" value={strat?.volume.resolues ?? 0} />
            <Stat label="Clôturées" value={strat?.volume.cloturees ?? 0} />
            <Stat
              label="Délai prise en charge"
              value={formatMinutes(strat?.delaisMoyens.priseEnChargeMinutes ?? null)}
            />
            <Stat
              label="Délai résolution"
              value={formatMinutes(strat?.delaisMoyens.resolutionMinutes ?? null)}
            />
            <Stat
              label="Satisfaction"
              value={
                strat?.tauxSatisfaction != null ? (
                  <span className="inline-flex items-center gap-1">
                    {strat.tauxSatisfaction}
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-zinc-400">({strat.nbEvaluations})</span>
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <Stat
              label="Taux de réouverture"
              value={strat?.tauxReouverture != null ? `${strat.tauxReouverture} %` : '—'}
            />
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DistributionCard title="Top catégories">
          {(strat?.distributionParCategorie ?? []).map((c) => (
            <Row key={c.code} label={c.label} value={c.count} />
          ))}
          {(strat?.distributionParCategorie ?? []).length === 0 && <Empty />}
        </DistributionCard>

        <DistributionCard title="Par priorité">
          {(strat?.distributionParPriorite ?? []).map((p) => (
            <div
              key={p.priorityId}
              className="flex items-center justify-between px-5 py-2.5 text-sm"
            >
              <Badge variant={priorityVariant(p.priorityId as PriorityCode)}>
                {priorityLabel(p.priorityId as PriorityCode)}
              </Badge>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{p.count}</span>
            </div>
          ))}
          {(strat?.distributionParPriorite ?? []).length === 0 && <Empty />}
        </DistributionCard>

        <DistributionCard title="Bugs par produit">
          {(strat?.bugsParProduit ?? []).map((b) => (
            <Row key={b.code} label={b.label} value={`${b.total} (${b.reproduits} reprod.)`} />
          ))}
          {(strat?.bugsParProduit ?? []).length === 0 && <Empty />}
        </DistributionCard>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Clock;
  tone: 'leaf' | 'amber' | 'rose' | 'zinc';
}) {
  const toneClass = {
    leaf: 'text-leaf-700 dark:text-leaf-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    zinc: 'text-zinc-500 dark:text-zinc-400',
  }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function DistributionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="p-5 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
      </div>
      <Separator />
      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">{children}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5 text-sm">
      <span className="truncate text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

function Empty() {
  return (
    <p className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
      Aucune donnée sur la période.
    </p>
  );
}
