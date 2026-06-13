import { Bell } from 'lucide-react';
import { fetchNotificationsAction } from '@/components/notifications/actions';
import { NotificationsFeed } from '@/components/notifications/notifications-feed';

export const metadata = { title: 'Notifications · MyTDFRIK' };

export default async function AdminNotificationsPage() {
  const initial = await fetchNotificationsAction(false, 100);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-leaf-700 dark:text-leaf-400">
          <Bell className="h-3.5 w-3.5" />
          Notifications
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mes notifications
        </h1>
      </header>
      <NotificationsFeed portal="admin" initial={initial} />
    </div>
  );
}
