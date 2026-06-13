import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { fetchUnreadCountAction } from '@/components/notifications/actions';
import { getSession } from '@/lib/auth';
import { getSidebarCollapsed } from '@/lib/sidebar';
import { getTheme } from '@/lib/theme';
import { ClientSidebar } from './_components/sidebar';
import { ClientTopBar } from './_components/topbar';

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  // Espace Client : rôles de scope CLIENT (ADR-004). Un interne est renvoyé
  // vers le portail Admin.
  if (session.user.scope !== 'CLIENT') {
    redirect('/admin');
  }
  const [theme, sidebarCollapsed, unread] = await Promise.all([
    getTheme(),
    getSidebarCollapsed(),
    fetchUnreadCountAction(),
  ]);

  return (
    <div className="flex min-h-screen bg-sand-50 dark:bg-zinc-950">
      <ClientSidebar collapsed={sidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ClientTopBar
          user={session.user}
          theme={theme}
          wsToken={session.accessToken}
          initialUnread={unread}
        />
        <main className="flex-1 overflow-x-hidden px-6 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
