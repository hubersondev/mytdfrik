'use client';

import { Menu, X, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface Props {
  /** Sections de navigation (mêmes données que la sidebar desktop). */
  sections: NavSection[];
  /** Sous-titre de marque (ex. « Espace Client », « Administration »). */
  subtitle: string;
  /** Racine du portail pour l'état actif exact (ex. « /client », « /admin »). */
  rootHref: string;
}

/**
 * Navigation mobile (< lg) : la sidebar desktop est masquée sous `lg`, ce
 * composant fournit un bouton hamburger ouvrant un tiroir latéral avec les
 * mêmes entrées de navigation.
 */
export function MobileNav({ sections, subtitle, rootHref }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Verrouille le défilement du corps tant que le tiroir est ouvert + Échap.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === rootHref
      ? pathname === rootHref
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            {/* Voile */}
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            />

            {/* Tiroir */}
            <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-gradient-to-b from-leaf-900 to-leaf-950 text-leaf-50 shadow-xl dark:from-zinc-900 dark:to-zinc-950">
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Logo size={22} priority />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-bold tracking-tight text-white">
                      MyTDFRIK
                    </span>
                    <span className="truncate text-[10px] uppercase tracking-wider text-leaf-300">
                      {subtitle}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer le menu"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-leaf-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-4">
                {sections.map((section) => (
                  <div key={section.title} className="flex flex-col gap-0.5">
                    <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-leaf-400/90">
                      {section.title}
                    </p>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      const disabled = Boolean(item.badge);
                      const className = cn(
                        'group relative flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors',
                        active
                          ? 'bg-white/10 font-medium text-white'
                          : 'text-leaf-100/80 hover:bg-white/5 hover:text-white',
                        disabled && 'cursor-not-allowed opacity-50',
                      );
                      const inner = (
                        <>
                          {active && (
                            <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-sand-400" />
                          )}
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              active ? 'text-sand-400' : 'text-leaf-300 group-hover:text-leaf-100',
                            )}
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                        </>
                      );
                      return disabled ? (
                        <div key={item.href} className={className} aria-disabled="true">
                          {inner}
                        </div>
                      ) : (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={className}
                        >
                          {inner}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}
