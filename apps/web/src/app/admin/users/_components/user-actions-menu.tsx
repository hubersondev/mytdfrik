'use client';

import { KeyRound, Loader2, MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  deactivateUserAction,
  reactivateUserAction,
  resetPasswordAction,
  type ActionResult,
} from '../actions';

interface Props {
  userId: string;
  isActive: boolean;
  fullName: string;
}

export function UserActionsMenu({ userId, isActive, fullName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, confirmMessage?: string) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.message) {
        window.alert(result.message);
      } else if (result.ok && result.message) {
        window.alert(result.message);
      }
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={`Actions pour ${fullName}`}
          className="h-8 w-8 p-0"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[15rem]">
        <DropdownMenuLabel className="truncate normal-case">{fullName}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={`/admin/users/${userId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            run(() => resetPasswordAction(userId));
          }}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Réinitialiser le mot de passe
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isActive ? (
          <DropdownMenuItem
            className={cn('cursor-pointer text-rose-600 focus:text-rose-700 dark:text-rose-400')}
            onSelect={(e) => {
              e.preventDefault();
              run(
                () => deactivateUserAction(userId),
                `Désactiver le compte de ${fullName} ? Ses sessions actives seront révoquées.`,
              );
            }}
          >
            <PowerOff className="h-3.5 w-3.5" />
            Désactiver le compte
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="cursor-pointer text-emerald-700 focus:text-emerald-800 dark:text-emerald-400"
            onSelect={(e) => {
              e.preventDefault();
              run(() => reactivateUserAction(userId));
            }}
          >
            <Power className="h-3.5 w-3.5" />
            Réactiver le compte
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
