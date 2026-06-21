'use client';

import { Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ActionResult {
  ok: boolean;
  message?: string;
}

interface Props {
  editHref: string;
  label: string;
  /** Action de suppression (id passé en argument). Omis = pas d'icône supprimer. */
  deleteAction?: (id: string) => Promise<ActionResult>;
  deleteId?: string;
  deleteConfirm?: string;
}

const iconBtn =
  'flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-leaf-50 hover:text-leaf-700 dark:hover:bg-leaf-950/40 dark:hover:text-leaf-300 disabled:opacity-50';

/** Icônes d'action en ligne (modifier / supprimer) — gabarit des listes. */
export function RowActions({ editHref, label, deleteAction, deleteId, deleteConfirm }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  const remove = async () => {
    if (!deleteAction || !deleteId) return;
    if (
      deleteConfirm &&
      !(await confirm({
        title: `Supprimer ${label}`,
        description: deleteConfirm,
        confirmLabel: 'Supprimer',
        tone: 'danger',
      }))
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAction(deleteId);
      if (!result.ok && result.message) window.alert(result.message);
      router.refresh();
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-end gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={editHref} aria-label={`Modifier ${label}`} className={iconBtn}>
              <Pencil className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Modifier</TooltipContent>
        </Tooltip>

        {deleteAction && deleteId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled={pending}
                aria-label={`Supprimer ${label}`}
                onClick={() => void remove()}
                className={cn(
                  iconBtn,
                  'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400',
                )}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Supprimer</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
