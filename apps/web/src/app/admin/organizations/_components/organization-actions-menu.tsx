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
import { deleteOrganizationAction } from '../actions';

interface Props {
  organizationId: string;
  name: string;
}

export function OrganizationActionsMenu({ organizationId, name }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (
      !window.confirm(
        `Supprimer l'organisation « ${name} » ? Les comptes Client qui y sont rattachés ne pourront plus être créés ou réaffectés tant qu'elle est supprimée.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteOrganizationAction(organizationId);
      if (!result.ok && result.message) {
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
          aria-label={`Actions pour ${name}`}
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
        <DropdownMenuLabel className="truncate normal-case">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={`/admin/organizations/${organizationId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </a>
        </DropdownMenuItem>

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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
