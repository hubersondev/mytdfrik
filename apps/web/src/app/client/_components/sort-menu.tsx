'use client';

import { ArrowUpDown, Check } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  DEFAULT_SORT,
  SORT_OPTIONS,
  SORT_ORDER,
  type SortKey,
} from './sort-options';

interface Props {
  current: SortKey;
}

export function SortMenu({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = (key: SortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === DEFAULT_SORT) {
      params.delete('sort');
    } else {
      params.set('sort', key);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const isCustom = current !== DEFAULT_SORT;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label="Trier les demandes"
          className={cn(
            isCustom &&
              'bg-leaf-50 text-leaf-800 hover:bg-leaf-100 dark:bg-leaf-950/40 dark:text-leaf-200',
          )}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {isCustom ? SORT_OPTIONS[current].short : 'Trier'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>Ordonner par</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SORT_ORDER.map((key) => {
          const active = current === key;
          return (
            <DropdownMenuItem
              key={key}
              onSelect={(event) => {
                event.preventDefault();
                apply(key);
              }}
              className="cursor-pointer"
            >
              <Check className={cn('h-3.5 w-3.5', active ? 'opacity-100' : 'opacity-0')} />
              <span>{SORT_OPTIONS[key].label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
