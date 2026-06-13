import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RowActions } from '@/components/ui/row-actions';
import { apiFetchOr } from '@/lib/api';
import { formatDurationMinutes, type PriorityCode } from '@/lib/requests';

export interface PriorityLevelRow {
  id: PriorityCode;
  label: string;
  description: string | null;
  slaFirstResponseMinutes: number;
  slaResolutionMinutes: number;
  is24x7: boolean;
}

export const metadata = { title: 'Priorités · MyTDFRIK' };

const ORDER: PriorityCode[] = ['P0', 'P1', 'P2', 'P3', 'P4'];

export default async function AdminPrioritiesPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const params = await searchParams;
  const levels = await apiFetchOr<PriorityLevelRow[]>('/priority-levels', []);
  const sorted = [...levels].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Configuration
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Niveaux de priorité
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Les 5 niveaux (P0 à P4) et leurs SLA (prise en charge et résolution). Set figé — seuls les
          délais et libellés sont modifiables, sur validation de la DG.
        </p>
      </header>

      {params.updated && <SuccessBanner>SLA mis à jour.</SuccessBanner>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <Th>Niveau</Th>
                <Th>Libellé</Th>
                <Th>Prise en charge</Th>
                <Th>Résolution</Th>
                <Th>Fenêtre</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80">
              {sorted.map((p) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <Badge variant={priorityVariant(p.id)}>{p.id}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.label}</p>
                    {p.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {formatDurationMinutes(p.slaFirstResponseMinutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {formatDurationMinutes(p.slaResolutionMinutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.is24x7 ? (
                      <Badge variant="warning">24/7</Badge>
                    ) : (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Heures ouvrées
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RowActions editHref={`/admin/priorities/${p.id}/edit`} label={p.label} />
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    Aucun niveau de priorité.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th scope="col" className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}
