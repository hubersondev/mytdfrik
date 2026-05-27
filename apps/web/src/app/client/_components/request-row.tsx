import {
  Bug,
  ChevronRight,
  Flag,
  HelpCircle,
  Sparkles,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, priorityVariant } from '@/components/ui/badge';
import {
  formatRelativeTime,
  statusLabel,
  statusVariant,
  type RequestSummary,
} from '@/lib/requests';
import { cn } from '@/lib/utils';

/**
 * Mappe le code catégorie (CDC §A3) à une icône + une teinte pastel.
 * Les codes inconnus retombent sur un fallback neutre — le label de la
 * catégorie reste affiché à droite de l'icône, donc rien n'est perdu.
 */
const CATEGORY_VISUAL: Record<string, { icon: LucideIcon; tone: string }> = {
  BUG_LOGICIEL: {
    icon: Bug,
    tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
  BUG_MATERIEL: {
    icon: Wrench,
    tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
  PANNE_SYSTEME: {
    icon: Zap,
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
  DEMANDE_INFO: {
    icon: HelpCircle,
    tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  },
  EVOLUTION_FONCTIONNELLE: {
    icon: Sparkles,
    tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  },
  RECLAMATION: {
    icon: Flag,
    tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
};

const DEFAULT_VISUAL = {
  icon: HelpCircle,
  tone: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400',
};

interface Props {
  request: RequestSummary;
  /** Initiales + couleur de l'avatar de l'interlocuteur affecté (S4+). */
  assignee?: { initials: string; toneClass: string } | null;
}

export function RequestRow({ request, assignee }: Props) {
  const visual = (request.category && CATEGORY_VISUAL[request.category.code]) ?? DEFAULT_VISUAL;
  const Icon = visual.icon;

  return (
    <li>
      <Link
        href={`/client/requests/${request.publicReference}`}
        className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
      >
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', visual.tone)}>
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono">{request.publicReference}</span>
            {request.category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{request.category.label}</span>
              </>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {request.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={priorityVariant(request.effectivePriorityId)}>
              {request.effectivePriorityId}
            </Badge>
            <Badge variant={statusVariant(request.status)}>{statusLabel(request.status)}</Badge>
            <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
              {formatRelativeTime(request.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {assignee ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn('text-[10px] font-semibold', assignee.toneClass)}>
                {assignee.initials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-zinc-300 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
              title="Pas encore affectée à un interlocuteur"
            >
              —
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500" />
        </div>
      </Link>
    </li>
  );
}
