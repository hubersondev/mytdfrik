import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiFetch, apiFetchOr, type ApiError } from '@/lib/api';
import { fetchRoleOptions } from '@/lib/role-options';
import {
  IMPACT_OPTIONS,
  URGENCY_OPTIONS,
  priorityLabel,
  statusLabel,
  statusVariant,
  type RequestDetail,
} from '@/lib/requests';
import type { CursorPage, UserRow } from '@/lib/users';
import { TransitionPanel } from '../_components/transition-panel';

interface HistoryEntry {
  id: string;
  transitionCode: string;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  event: string;
  createdAt: string;
  actor: { firstName: string; lastName: string } | null;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  let request: RequestDetail;
  try {
    request = await apiFetch<RequestDetail>(
      `/requests/by-reference/${encodeURIComponent(reference)}`,
    );
  } catch (error) {
    if ((error as ApiError)?.status === 404) notFound();
    throw error;
  }

  const [codes, history, usersPage, roles] = await Promise.all([
    apiFetchOr<string[]>(`/requests/${request.id}/transitions`, []),
    apiFetchOr<HistoryEntry[]>(`/requests/${request.id}/history`, []),
    apiFetchOr<CursorPage<UserRow>>('/users?limit=100', {
      items: [],
      page_info: { has_next: false, next_cursor: null },
    }),
    fetchRoleOptions(),
  ]);

  // Responsables affectables = utilisateurs actifs dont le rôle est interne.
  const internalRoleIds = new Set(roles.filter((r) => r.scope === 'INTERNAL').map((r) => r.id));
  const roleLabel = new Map(roles.map((r) => [r.id, r.label]));
  const assignees = usersPage.items
    .filter((u) => u.isActive && internalRoleIds.has(u.roleId))
    .map((u) => ({
      id: u.id,
      label: `${u.firstName} ${u.lastName} — ${roleLabel.get(u.roleId) ?? u.roleId}`,
    }));

  const impactLabel =
    IMPACT_OPTIONS.find((o) => o.value === request.impact)?.label ?? request.impact;
  const urgencyLabelText =
    URGENCY_OPTIONS.find((o) => o.value === request.urgency)?.label ?? request.urgency;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/requests"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la file
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {request.publicReference}
          </span>
          <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
          <Badge variant={priorityVariant(request.effectivePriorityId)}>
            {priorityLabel(request.effectivePriorityId)}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {request.title}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <div className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {request.description}
              </p>
            </div>
            {request.clientContextNote && (
              <>
                <Separator />
                <div className="p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Contexte additionnel
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {request.clientContextNote}
                  </p>
                </div>
              </>
            )}
          </Card>

          {/* Historique (CDC §4.3) */}
          <Card>
            <div className="flex items-center gap-2 p-5 pb-3">
              <Clock className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Historique
              </h2>
            </div>
            <Separator />
            <ol className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
              {history.map((h) => (
                <li key={h.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Badge variant={statusVariant(h.fromStatus as never)}>
                        {statusLabel(h.fromStatus as never)}
                      </Badge>
                      <span className="text-zinc-400">→</span>
                      <Badge variant={statusVariant(h.toStatus as never)}>
                        {statusLabel(h.toStatus as never)}
                      </Badge>
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {dateFmt.format(new Date(h.createdAt))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-mono">{h.transitionCode}</span>
                    {h.actor ? ` · ${h.actor.firstName} ${h.actor.lastName}` : ' · Système'}
                  </p>
                  {h.note && (
                    <p className="mt-1.5 whitespace-pre-wrap rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
                      {h.note}
                    </p>
                  )}
                </li>
              ))}
              {history.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Aucune transition enregistrée.
                </li>
              )}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <TransitionPanel
            reference={request.publicReference}
            requestId={request.id}
            currentStatus={request.status}
            codes={codes}
            assignees={assignees}
            systemPriority={request.systemPriorityId}
          />

          <SlaCard request={request} />

          <Card>
            <div className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Qualification
              </h2>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                <Row label="Catégorie">{request.category?.label ?? '—'}</Row>
                <Row label="Impact">{impactLabel}</Row>
                <Row label="Urgence">{urgencyLabelText}</Row>
                <Row label="Priorité système">
                  <Badge variant={priorityVariant(request.systemPriorityId)}>
                    {request.systemPriorityId}
                  </Badge>
                </Row>
                <Row label="Priorité effective">
                  <Badge variant={priorityVariant(request.effectivePriorityId)}>
                    {request.effectivePriorityId}
                  </Badge>
                </Row>
                {request.priorityOverrideReason && (
                  <Row label="Motif d'ajustement">
                    <span className="text-xs italic text-zinc-600 dark:text-zinc-400">
                      {request.priorityOverrideReason}
                    </span>
                  </Row>
                )}
              </dl>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

function SlaBadge({ value, dueAt }: { value: boolean | null; dueAt: string | null }) {
  if (value === true) return <Badge variant="success">Respecté</Badge>;
  if (value === false) return <Badge variant="danger">Dépassé</Badge>;
  if (dueAt) {
    const late = new Date(dueAt).getTime() < new Date().getTime();
    return <Badge variant={late ? 'danger' : 'outline'}>{late ? 'En retard' : 'En cours'}</Badge>;
  }
  return <span className="text-xs text-zinc-400">—</span>;
}

function SlaCard({ request }: { request: RequestDetail }) {
  const hasSla = request.slaDueFirstResponseAt || request.slaDueResolutionAt;
  return (
    <Card>
      <div className="flex items-center gap-2 p-5 pb-3">
        <Clock className="h-4 w-4 text-sand-700 dark:text-sand-300" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Engagements de service
        </h2>
      </div>
      <Separator />
      <div className="flex flex-col gap-3 p-5 text-sm">
        {!hasSla && (
          <p className="text-zinc-500 dark:text-zinc-400">
            Les échéances sont calculées à la qualification de la demande.
          </p>
        )}
        {request.slaDueFirstResponseAt && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Prise en charge</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">
                {dateFmt.format(new Date(request.slaDueFirstResponseAt))}
              </dd>
            </div>
            <SlaBadge
              value={request.isSlaFirstResponseRespected}
              dueAt={request.slaDueFirstResponseAt}
            />
          </div>
        )}
        {request.slaDueResolutionAt && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Résolution</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">
                {dateFmt.format(new Date(request.slaDueResolutionAt))}
              </dd>
            </div>
            <SlaBadge value={request.isSlaResolutionRespected} dueAt={request.slaDueResolutionAt} />
          </div>
        )}
      </div>
    </Card>
  );
}
