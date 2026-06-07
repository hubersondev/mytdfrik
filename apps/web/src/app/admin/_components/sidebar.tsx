'use client';

import {
  Boxes,
  Building,
  Building2,
  Bug,
  Globe,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Sparkles,
  Tags,
  TicketCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Logo } from '@/components/logo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toggleSidebarAction } from './sidebar-actions';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const NAV_ADMIN: NavItem[] = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Utilisateurs', href: '/admin/users', icon: Users },
  { label: 'Organisations', href: '/admin/organizations', icon: Building2 },
  { label: 'Demandes', href: '/admin/requests', icon: TicketCheck },
  { label: 'Bugs', href: '/admin/bugs', icon: Bug, badge: 'S7' },
];

const NAV_CONFIG: NavItem[] = [
  { label: 'Catégories', href: '/admin/categories', icon: Tags },
  { label: 'Produits', href: '/admin/products', icon: Boxes, badge: 'S3' },
  { label: 'Priorités', href: '/admin/priorities', icon: Sparkles, badge: 'S3' },
  { label: 'Pays', href: '/admin/countries', icon: Globe },
  { label: 'Villes', href: '/admin/cities', icon: Building },
];

const NAV_SYSTEM: NavItem[] = [
  { label: 'Rôles & permissions', href: '/admin/roles', icon: Shield },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings, badge: 'S3' },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(() => {
      void toggleSidebarAction(!collapsed);
    });
  };

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col self-start border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:flex',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Header logo + toggle */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-zinc-200/70 px-3 dark:border-zinc-800',
            collapsed ? 'justify-center' : 'justify-between gap-2',
          )}
        >
          {!collapsed && <Logo size={28} priority />}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggle}
                disabled={pending}
                aria-label={collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-leaf-50 hover:text-leaf-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-leaf-950/40 dark:hover:text-leaf-300"
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

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-4">
          <NavSection
            title="Administration"
            items={NAV_ADMIN}
            pathname={pathname}
            collapsed={collapsed}
          />
          <NavSection
            title="Configuration"
            items={NAV_CONFIG}
            pathname={pathname}
            collapsed={collapsed}
          />
          <NavSection
            title="Système"
            items={NAV_SYSTEM}
            pathname={pathname}
            collapsed={collapsed}
          />
        </nav>

        {/* Footer version (caché en mode collapsed pour éviter un border-t orphelin) */}
        {!collapsed && (
          <div className="flex items-center justify-start border-t border-zinc-200/70 px-3 py-3 dark:border-zinc-800">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Sprint 2 · v0.0
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
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
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
  const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
  const isDisabled = Boolean(item.badge);

  const baseClass = cn(
    'group relative flex h-9 items-center rounded-md text-sm transition-colors',
    collapsed ? 'mx-auto w-9 justify-center px-0' : 'w-full gap-2.5 px-3',
    isActive
      ? 'bg-leaf-50 text-leaf-900 dark:bg-leaf-900/40 dark:text-leaf-100'
      : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100',
    isDisabled &&
      'cursor-not-allowed opacity-60 hover:bg-transparent hover:text-zinc-600 dark:hover:bg-transparent dark:hover:text-zinc-400',
  );

  const iconClass = cn(
    'h-4 w-4 shrink-0',
    isActive ? 'text-leaf-700 dark:text-leaf-400' : 'text-zinc-500 dark:text-zinc-400',
  );

  const inner = (
    <>
      {/* Barre verticale gauche pour l'état actif (style modèle de référence) */}
      {isActive && !collapsed && (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-r-full bg-leaf-700 dark:bg-leaf-500" />
      )}
      <Icon className={iconClass} />
      {!collapsed && (
        <>
          <span className={cn('flex-1 truncate', isActive && 'font-medium')}>{item.label}</span>
          {item.badge && (
            <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
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
