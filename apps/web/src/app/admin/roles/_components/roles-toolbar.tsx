'use client';

import { Check, Filter, Search, Shield, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  SCOPE_FILTERS,
  SCOPE_ORDER,
  STATUS_FILTERS,
  STATUS_ORDER,
  type ScopeFilterKey,
  type StatusFilterKey,
} from '@/lib/roles';
import { cn } from '@/lib/utils';

interface Props {
  scope: ScopeFilterKey;
  status: StatusFilterKey;
  query: string;
}

export function RolesToolbar({ scope, status, query }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setSearch(query);
  }

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const setScope = (value: ScopeFilterKey) =>
    pushParams((p) => (value === 'ALL' ? p.delete('scope') : p.set('scope', value)));
  const setStatus = (value: StatusFilterKey) =>
    pushParams((p) => (value === 'ALL' ? p.delete('status') : p.set('status', value)));
  const submitSearch = (value: string) =>
    pushParams((p) => {
      const v = value.trim();
      if (v) p.set('q', v);
      else p.delete('q');
    });

  const hasFilters = scope !== 'ALL' || status !== 'ALL' || query.trim() !== '';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative flex-1 sm:max-w-xs"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(search);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un rôle…"
          className="h-9 pl-9"
          aria-label="Rechercher un rôle"
        />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className={cn(
              scope !== 'ALL' &&
                'bg-leaf-50 text-leaf-800 hover:bg-leaf-100 dark:bg-leaf-950/40 dark:text-leaf-200',
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            {SCOPE_FILTERS[scope].label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          <DropdownMenuLabel>Filtrer par portail</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SCOPE_ORDER.map((key) => (
            <DropdownMenuItem
              key={key}
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setScope(key);
              }}
            >
              <Check className={cn('h-3.5 w-3.5', scope === key ? 'opacity-100' : 'opacity-0')} />
              {SCOPE_FILTERS[key].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className={cn(
              status !== 'ALL' &&
                'bg-leaf-50 text-leaf-800 hover:bg-leaf-100 dark:bg-leaf-950/40 dark:text-leaf-200',
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {STATUS_FILTERS[status].label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_ORDER.map((key) => (
            <DropdownMenuItem
              key={key}
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setStatus(key);
              }}
            >
              <Check className={cn('h-3.5 w-3.5', status === key ? 'opacity-100' : 'opacity-0')} />
              {STATUS_FILTERS[key].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
          className="text-zinc-500"
        >
          <X className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
