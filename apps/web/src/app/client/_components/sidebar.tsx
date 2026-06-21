'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Logo } from '@/components/logo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CLIENT_NAV, type NavItem } from './nav';
import { toggleClientSidebarAction } from './sidebar-actions';

interface SidebarProps {
  collapsed: boolean;
}

export function ClientSidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(() => {
      void toggleClientSidebarAction(!collapsed);
    });
  };

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col self-start bg-gradient-to-b from-leaf-900 to-leaf-950 text-leaf-50 shadow-xl dark:border-r dark:border-zinc-800/80 dark:from-zinc-900 dark:to-zinc-950 lg:flex',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-white/10 px-3',
            collapsed ? 'justify-center' : 'justify-between gap-2',
          )}
        >
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-white px-2 ring-1 ring-black/5">
                <Logo size={22} priority />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-bold tracking-tight text-white">
                  MyTDFRIK
                </span>
                <span className="truncate text-[10px] uppercase tracking-wider text-leaf-300">
                  Espace Client
                </span>
              </span>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                disabled={pending}
                aria-label={collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-leaf-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? 'Étendre' : 'Réduire'}</TooltipContent>
          </Tooltip>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-4">
          {CLIENT_NAV.map((section) => (
            <NavSection
              key={section.title}
              title={section.title}
              items={section.items}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {!collapsed && (
          <div className="flex items-center justify-start border-t border-white/10 px-3 py-3">
            <span className="text-[10px] uppercase tracking-wider text-leaf-400">
              MyTDFRIK · Espace Client
            </span>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

function NavSection({
  title,
  items,
  pathname,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && (
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-leaf-400/90">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavItemLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
      ))}
    </div>
  );
}

function NavItemLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const isActive =
    item.href === '/client'
      ? pathname === '/client'
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const isDisabled = Boolean(item.badge);

  const baseClass = cn(
    'group relative flex h-9 items-center rounded-lg text-sm transition-colors',
    collapsed ? 'mx-auto w-9 justify-center px-0' : 'w-full gap-2.5 px-3',
    isActive
      ? 'bg-white/10 font-medium text-white'
      : 'text-leaf-100/80 hover:bg-white/5 hover:text-white',
    isDisabled && 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-leaf-100/80',
  );

  const iconClass = cn(
    'h-4 w-4 shrink-0',
    isActive ? 'text-sand-400' : 'text-leaf-300 group-hover:text-leaf-100',
  );

  const inner = (
    <>
      {isActive && !collapsed && (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full bg-sand-400" />
      )}
      <Icon className={iconClass} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-brand-500/25 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-200">
              {item.badge}
            </span>
          )}
        </>
      )}
    </>
  );

  const node = isDisabled ? (
    <div className={baseClass} aria-disabled="true">
      {inner}
    </div>
  ) : (
    <Link href={item.href} className={baseClass}>
      {inner}
    </Link>
  );

  if (!collapsed) {
    return node;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        <span>{item.label}</span>
        {item.badge && (
          <span className="rounded bg-zinc-700 px-1 text-[10px] uppercase tracking-wide text-zinc-200 dark:bg-zinc-300 dark:text-zinc-700">
            {item.badge}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
