'use client';

import { LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { MobileNav } from '@/components/mobile-nav';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { GlobalSearch } from '@/components/search/global-search';
import { ADMIN_NAV } from './nav';
import { Avatar, AvatarFallback, initials } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { logoutAction } from '../actions';

interface TopBarProps {
  user: { firstName: string; lastName: string; email: string; roleId: string };
  theme: 'light' | 'dark';
  wsToken: string;
  initialUnread: number;
}

export function TopBar({ user, theme, wsToken, initialUnread }: TopBarProps) {
  const [loggingOut, startLogout] = useTransition();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200/70 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/70 sm:px-6">
      {/* Menu mobile (sidebar masquée sous lg) */}
      <MobileNav sections={ADMIN_NAV} subtitle="Administration" rootHref="/admin" />

      {/* Recherche globale (palette ⌘K) — demandes / utilisateurs / catalogue */}
      <GlobalSearch />

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle current={theme} />

        <NotificationBell portal="admin" wsToken={wsToken} initialUnread={initialUnread} />

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              aria-label="Menu utilisateur"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-leaf-100 text-leaf-700 dark:bg-leaf-950 dark:text-leaf-300">
                  {initials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col leading-tight md:flex">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {user.roleId}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Connecté en tant que</DropdownMenuLabel>
            <div className="px-2 pb-2 text-xs text-zinc-600 dark:text-zinc-400">{user.email}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/admin/profile">
                <UserCircle className="h-4 w-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={loggingOut}
              onSelect={(event) => {
                event.preventDefault();
                startLogout(() => {
                  void logoutAction();
                });
              }}
              className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/40 dark:focus:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
