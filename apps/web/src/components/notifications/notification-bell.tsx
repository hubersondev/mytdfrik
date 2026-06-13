'use client';

import { Bell, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiWsOrigin, type NotificationView } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { fetchNotificationsAction, markAllReadAction, markReadAction } from './actions';

interface Props {
  portal: 'admin' | 'client';
  /** Jeton d'accès JWT pour authentifier le handshake WebSocket (court, 15 min). */
  wsToken: string;
  initialUnread: number;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function NotificationBell({ portal, wsToken, initialUnread }: Props) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationView[] | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Connexion WebSocket temps réel (CDC §7 WEB_PUSH_REALTIME).
  useEffect(() => {
    if (!wsToken) return;
    const socket: Socket = io(`${apiWsOrigin()}/notifications`, {
      transports: ['websocket'],
      auth: { token: wsToken },
    });
    socket.on('notification', () => {
      setUnread((c) => c + 1);
      setItems(null); // force un re-fetch à la prochaine ouverture
    });
    return () => {
      socket.disconnect();
    };
  }, [wsToken]);

  // Fermeture au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      setLoading(true);
      const list = await fetchNotificationsAction(false, 8);
      setItems(list);
      setLoading(false);
    }
  };

  const onItemClick = async (n: NotificationView) => {
    if (!n.isReadInApp) {
      await markReadAction(n.id);
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.payload.url) router.push(n.payload.url);
  };

  const onMarkAll = async () => {
    await markAllReadAction();
    setUnread(0);
    setItems((prev) => prev?.map((n) => ({ ...n, isReadInApp: true })) ?? prev);
    router.refresh();
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <Check className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto border-t border-zinc-200/80 dark:border-zinc-800">
            {loading && (
              <div className="flex items-center justify-center py-8 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!loading &&
              (items ?? []).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onItemClick(n)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 border-b border-zinc-100 px-4 py-2.5 text-left last:border-0 hover:bg-zinc-50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40',
                    !n.isReadInApp && 'bg-leaf-50/40 dark:bg-leaf-950/20',
                  )}
                >
                  <span className="flex w-full items-center gap-2">
                    {!n.isReadInApp && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-600" />
                    )}
                    <span className="flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {n.payload.title}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {n.payload.body}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {dateFmt.format(new Date(n.createdAt))}
                  </span>
                </button>
              ))}
            {!loading && (items ?? []).length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Aucune notification.
              </p>
            )}
          </div>
          <Link
            href={`/${portal}/notifications`}
            onClick={() => setOpen(false)}
            className="block border-t border-zinc-200/80 px-4 py-2.5 text-center text-xs font-medium text-leaf-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-leaf-400 dark:hover:bg-zinc-800/40"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
