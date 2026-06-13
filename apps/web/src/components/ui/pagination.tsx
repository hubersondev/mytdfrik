'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PAGE_SIZE_OPTIONS } from '@/lib/paginate';
import { cn } from '@/lib/utils';

interface Props {
  /** Page courante (1-based). */
  page: number;
  pageSize: number;
  /** Nombre total d'éléments (après filtrage). */
  total: number;
}

/**
 * Pagination liée à l'URL — sélecteur de taille (`?size=`) + navigation
 * (`?page=`) centrée. Préserve les autres paramètres (filtres, tri, recherche).
 * Le changement de taille réinitialise la page courante.
 */
export function Pagination({ page, pageSize, total }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (total === 0) return null;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageHref = (p: number): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const onSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('size', String(size));
    params.delete('page'); // retour à la première page
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-col items-center gap-3 border-t border-zinc-200/70 px-4 py-3 dark:border-zinc-800 sm:grid sm:grid-cols-3">
      {/* Gauche : sélecteur de taille */}
      <label className="flex items-center gap-2 justify-self-start text-xs text-zinc-500 dark:text-zinc-400">
        Afficher
        <select
          value={pageSize}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500/30 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          aria-label="Nombre d'éléments par page"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        par page
      </label>

      {/* Centre : navigation */}
      <div className="flex items-center justify-center gap-1">
        {pages > 1 ? (
          <>
            <PagerLink href={pageHref(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
              Précédent
            </PagerLink>
            <span className="px-2 text-xs text-zinc-500 dark:text-zinc-400">
              Page {page} / {pages}
            </span>
            <PagerLink href={pageHref(page + 1)} disabled={page >= pages}>
              Suivant
              <ChevronRight className="h-3.5 w-3.5" />
            </PagerLink>
          </>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Page unique</span>
        )}
      </div>

      {/* Droite : plage affichée */}
      <span className="justify-self-end text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{start}</span>–
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{end}</span> sur{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{total}</span>
      </span>
    </div>
  );
}

function PagerLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
    disabled
      ? 'cursor-not-allowed border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600'
      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800',
  );
  if (disabled) {
    return (
      <span aria-disabled className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} className={className}>
      {children}
    </Link>
  );
}
