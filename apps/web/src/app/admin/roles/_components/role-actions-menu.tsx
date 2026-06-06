'use client';

import { Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { deleteRoleAction } from '../actions';

interface Props {
  roleId: string;
  label: string;
  isSystem: boolean;
}

export function RoleActionsMenu({ roleId, label, isSystem }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm(`Supprimer le rôle « ${label} » ?`)) return;
    startTransition(async () => {
      const result = await deleteRoleAction(roleId);
      if (!result.ok && result.message) window.alert(result.message);
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
          aria-label={`Actions pour ${label}`}
          className="h-8 w-8 p-0"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel className="truncate normal-case">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={`/admin/roles/${roleId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </a>
        </DropdownMenuItem>
        {!isSystem && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-rose-600 focus:text-rose-700 dark:text-rose-400"
              onSelect={(e) => {
                e.preventDefault();
                remove();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
