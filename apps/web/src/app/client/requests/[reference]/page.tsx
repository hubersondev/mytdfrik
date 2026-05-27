import { ArrowLeft, CheckCircle2, Clock, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, priorityVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiFetch, type ApiError } from '@/lib/api';
import {
  IMPACT_OPTIONS,
  URGENCY_OPTIONS,
  priorityLabel,
  statusLabel,
  statusVariant,
  type RequestDetail,
} from '@/lib/requests';

interface PageProps {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ created?: string }>;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

export default async function RequestDetailPage({ params, searchParams }: PageProps) {
  const { reference } = await params;
  const { created } = await searchParams;

  let request: RequestDetail;
  try {
    request = await apiFetch<RequestDetail>(
      `/requests/by-reference/${encodeURIComponent(reference)}`,
    );
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError?.status === 404) {
      notFound();
    }
    throw error;
  }

  const impactLabel =
    IMPACT_OPTIONS.find((o) => o.value === request.impact)?.label ?? request.impact;
  const urgencyLabelText =
    URGENCY_OPTIONS.find((o) => o.value === request.urgency)?.label ?? request.urgency;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/client/requests"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à mes demandes
        </Link>
      </div>

      {created === '1' && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Votre demande a bien été enregistrée.</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <MailCheck className="h-3.5 w-3.5" />
              Un accusé de réception vient de vous être envoyé par courriel.
            </p>
          </div>
        </div>
      )}

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
        <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Clock className="h-3.5 w-3.5" />
          Soumise le {dateFormatter.format(new Date(request.createdAt))}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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

        <Card>
          <div className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Détails de qualification
            </h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <DetailRow label="Catégorie">{request.category?.label ?? '—'}</DetailRow>
              <DetailRow label="Impact">{impactLabel}</DetailRow>
              <DetailRow label="Urgence">{urgencyLabelText}</DetailRow>
              <DetailRow label="Priorité système">
                <Badge variant={priorityVariant(request.systemPriorityId)}>
                  {request.systemPriorityId}
                </Badge>
              </DetailRow>
              <DetailRow label="Priorité effective">
                <Badge variant={priorityVariant(request.effectivePriorityId)}>
                  {request.effectivePriorityId}
                </Badge>
              </DetailRow>
              {request.priorityOverrideReason && (
                <DetailRow label="Motif d'ajustement">
                  <span className="text-xs italic text-zinc-600 dark:text-zinc-400">
                    {request.priorityOverrideReason}
                  </span>
                </DetailRow>
              )}
            </dl>
          </div>
        </Card>
      </div>

      <Card className="border-dashed bg-transparent">
        <div className="flex items-start gap-3 p-5">
          <Clock className="mt-0.5 h-4 w-4 text-zinc-400" />
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">Prochaines étapes</p>
            <p className="mt-1">
              Un Gestionnaire qualifie votre demande, l&apos;affecte à un Responsable, puis le suivi
              détaillé (messagerie, pièces jointes, historique) sera activé dans les prochains
              sprints.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}
