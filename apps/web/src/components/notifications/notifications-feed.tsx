'use client';

import { Bell, Check, Loader2, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { NotificationView } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { fetchNotificationsAction, markAllReadAction, markReadAction } from './actions';

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function NotificationsFeed({
  portal,
  initial,
}: {
  portal: 'admin' | 'client';
  initial: NotificationView[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pending, startTransition] = useTransition();

  const applyFilter = (next: boolean) => {
    setUnreadOnly(next);
    startTransition(async () => {
      setItems(await fetchNotificationsAction(next, 100));
    });
  };

  const open = (n: NotificationView) => {
    startTransition(async () => {
      if (!n.isReadInApp) await markReadAction(n.id);
      if (n.payload.url) router.push(n.payload.url);
    });
  };

  const markAll = () => {
    startTransition(async () => {
      await markAllReadAction(`/${portal}/notifications`);
      setItems((prev) => prev.map((n) => ({ ...n, isReadInApp: true })));
      router.refresh();
    });
  };

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
          <FilterButton active={!unreadOnly} onClick={() => applyFilter(false)}>
            Toutes
          </FilterButton>
          <FilterButton active={unreadOnly} onClick={() => applyFilter(true)}>
            Non lues
          </FilterButton>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/${portal}/notifications/preferences`}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Préférences
          </Link>
          <Button variant="ghost" size="sm" onClick={markAll} disabled={pending}>
            <Check className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      </div>
      <Separator />

      <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
        {pending && items.length === 0 && (
          <li className="flex justify-center py-10 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </li>
        )}
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => open(n)}
              className={cn(
                'flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                !n.isReadInApp && 'bg-leaf-50/40 dark:bg-leaf-950/20',
              )}
            >
              <span
                className={cn(
                  'mt-1 h-2 w-2 shrink-0 rounded-full',
                  n.isReadInApp ? 'bg-transparent' : 'bg-leaf-600',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {n.payload.title}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {dateFmt.format(new Date(n.createdAt))}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">
                  {n.payload.body}
                </span>
                {n.payload.publicReference && (
                  <span className="mt-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {n.payload.publicReference}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
        {!pending && items.length === 0 && (
          <li className="flex flex-col items-center gap-2 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <Bell className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
            {unreadOnly ? 'Aucune notification non lue.' : 'Aucune notification.'}
          </li>
        )}
      </ul>
    </Card>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-leaf-700 text-white dark:bg-leaf-600'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
      )}
    >
      {children}
    </button>
  );
}
