'use client';

import { KeyRound, Loader2, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useConfirm, type ConfirmOptions } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  deactivateUserAction,
  deleteUserAction,
  reactivateUserAction,
  resetPasswordAction,
  type ActionResult,
} from '../actions';

interface Props {
  userId: string;
  isActive: boolean;
  fullName: string;
}

const iconBtn =
  'flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-leaf-50 hover:text-leaf-700 dark:hover:bg-leaf-950/40 dark:hover:text-leaf-300 disabled:opacity-50';

/** Actions en ligne par ligne d'utilisateur (édition, activation, réinitialisation). */
export function UserRowActions({ userId, isActive, fullName }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = async (action: () => Promise<ActionResult>, confirmOpts?: ConfirmOptions) => {
    if (confirmOpts && !(await confirm(confirmOpts))) return;
    startTransition(async () => {
      const result = await action();
      if (result.message) toast(result.message, result.ok ? 'success' : 'error');
      router.refresh();
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-end gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/admin/users/${userId}/edit`}
              aria-label={`Modifier ${fullName}`}
              className={iconBtn}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Modifier</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={pending}
              aria-label={`Réinitialiser le mot de passe de ${fullName}`}
              onClick={() => run(() => resetPasswordAction(userId))}
              className={iconBtn}
            >
              <KeyRound className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Réinitialiser le mot de passe</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={pending}
              aria-label={isActive ? `Désactiver ${fullName}` : `Réactiver ${fullName}`}
              onClick={() =>
                isActive
                  ? void run(() => deactivateUserAction(userId), {
                      title: 'Désactiver le compte',
                      description: `Désactiver le compte de ${fullName} ? Ses sessions actives seront révoquées.`,
                      confirmLabel: 'Désactiver',
                      tone: 'danger',
                    })
                  : void run(() => reactivateUserAction(userId))
              }
              className={cn(
                iconBtn,
                isActive
                  ? 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
                  : 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400',
              )}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isActive ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isActive ? 'Désactiver' : 'Réactiver'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={pending}
              aria-label={`Supprimer ${fullName}`}
              onClick={() =>
                void run(() => deleteUserAction(userId), {
                  title: "Supprimer l'utilisateur",
                  description: `Supprimer définitivement le compte de ${fullName} ? Il n'apparaîtra plus dans la liste et ses sessions seront révoquées.`,
                  confirmLabel: 'Supprimer',
                  tone: 'danger',
                })
              }
              className={cn(
                iconBtn,
                'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400',
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Supprimer</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
