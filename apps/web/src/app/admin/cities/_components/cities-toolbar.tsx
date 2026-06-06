'use client';

import { ArrowUpDown, Check, Filter, Globe, Search, X } from 'lucide-react';
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
  DEFAULT_SORT,
  SORT_OPTIONS,
  SORT_ORDER,
  STATUS_FILTERS,
  STATUS_ORDER,
  type CountryRow,
  type SortKey,
  type StatusFilterKey,
} from '@/lib/geo';
import { cn } from '@/lib/utils';

interface Props {
  countries: CountryRow[];
  countryId: string | 'ALL';
  status: StatusFilterKey;
  sort: SortKey;
  query: string;
}

export function CitiesToolbar({ countries, countryId, status, sort, query }: Props) {
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

  const setCountry = (value: string | 'ALL') =>
    pushParams((p) => (value === 'ALL' ? p.delete('country_id') : p.set('country_id', value)));
  const setStatus = (value: StatusFilterKey) =>
    pushParams((p) => (value === 'ALL' ? p.delete('status') : p.set('status', value)));
  const setSort = (value: SortKey) =>
    pushParams((p) => (value === DEFAULT_SORT ? p.delete('sort') : p.set('sort', value)));
  const submitSearch = (value: string) =>
    pushParams((p) => {
      const v = value.trim();
      if (v) p.set('q', v);
      else p.delete('q');
    });

  const activeCountries = countries.filter((c) => c.isActive);
  const currentCountryName =
    countryId === 'ALL' ? 'Pays' : (countries.find((c) => c.id === countryId)?.name ?? 'Pays');
  const hasFilters = countryId !== 'ALL' || status !== 'ALL' || query.trim() !== '';

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
          placeholder="Rechercher une ville…"
          className="h-9 pl-9"
          aria-label="Rechercher une ville"
        />
      </form>

      {/* Filtre pays */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className={cn(
              countryId !== 'ALL' &&
                'bg-leaf-50 text-leaf-800 hover:bg-leaf-100 dark:bg-leaf-950/40 dark:text-leaf-200',
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            {currentCountryName}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-80 min-w-[14rem] overflow-y-auto">
          <DropdownMenuLabel>Filtrer par pays</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setCountry('ALL');
            }}
          >
            <Check
              className={cn('h-3.5 w-3.5', countryId === 'ALL' ? 'opacity-100' : 'opacity-0')}
            />
            Tous les pays
          </DropdownMenuItem>
          {activeCountries.map((c) => (
            <DropdownMenuItem
              key={c.id}
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setCountry(c.id);
              }}
            >
              <Check
                className={cn('h-3.5 w-3.5', countryId === c.id ? 'opacity-100' : 'opacity-0')}
              />
              {c.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtre statut */}
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

      {/* Tri */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className={cn(
              sort !== DEFAULT_SORT &&
                'bg-leaf-50 text-leaf-800 hover:bg-leaf-100 dark:bg-leaf-950/40 dark:text-leaf-200',
            )}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sort === DEFAULT_SORT ? 'Trier' : SORT_OPTIONS[sort].short}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[16rem]">
          <DropdownMenuLabel>Ordonner par</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_ORDER.map((key) => (
            <DropdownMenuItem
              key={key}
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setSort(key);
              }}
            >
              <Check className={cn('h-3.5 w-3.5', sort === key ? 'opacity-100' : 'opacity-0')} />
              {SORT_OPTIONS[key].label}
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
