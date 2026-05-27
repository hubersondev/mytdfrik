'use client';

import { Check, Filter } from 'lucide-react';
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
  BUCKET_ORDER,
  FILTER_BUCKETS,
  type FilterBucketKey,
} from './filter-buckets';

interface Props {
  /** Bucket actuellement actif (résolu côté serveur depuis searchParams). */
  current: FilterBucketKey;
  /** Bouton compact (« Filtrer » sans label étendu) — utilisé dans la barre d'outils. */
  compact?: boolean;
}

export function FilterMenu({ current, compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = (key: FilterBucketKey) => {
    const params = new URLSearchParams(searchParams.toString());
    const bucket = FILTER_BUCKETS[key];
    if (!bucket.statuses) {
      params.delete('status');
    } else {
      params.set('status', bucket.statuses.join(','));
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const isFiltered = current !== 'ALL';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label="Filtrer les demandes"
          className={cn(
            isFiltered &&
              'bg-leaf-50 text-leaf-800 hover:bg-leaf-100 dark:bg-leaf-950/40 dark:text-leaf-200',
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {!compact && (isFiltered ? FILTER_BUCKETS[current].label : 'Filtrer')}
          {compact && 'Filtrer'}
          {isFiltered && (
            <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-leaf-700 px-1 text-[10px] font-semibold text-white">
              1
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BUCKET_ORDER.map((key) => {
          const bucket = FILTER_BUCKETS[key];
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
              <span>{bucket.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
