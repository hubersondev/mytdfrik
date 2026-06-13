'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, apiFetchOr } from '@/lib/api';
import type { NotificationView, PreferenceMap } from '@/lib/notifications';

/** Liste mes notifications (récentes ou non lues). */
export async function fetchNotificationsAction(
  unreadOnly = false,
  limit = 50,
): Promise<NotificationView[]> {
  return apiFetchOr<NotificationView[]>(`/notifications?unread=${unreadOnly}&limit=${limit}`, []);
}

/** Compteur de notifications non lues (badge). */
export async function fetchUnreadCountAction(): Promise<number> {
  const res = await apiFetchOr<{ count: number }>('/notifications/unread-count', {
    count: 0,
  });
  return res.count;
}

export async function markReadAction(id: string): Promise<void> {
  try {
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
  } catch {
    /* best-effort */
  }
}

export async function markAllReadAction(revalidate?: string): Promise<void> {
  try {
    await apiFetch('/notifications/read-all', { method: 'POST' });
  } catch {
    /* best-effort */
  }
  if (revalidate) revalidatePath(revalidate);
}

export async function fetchPreferencesAction(): Promise<PreferenceMap> {
  return apiFetchOr<PreferenceMap>('/notifications/preferences', {});
}

export async function updatePreferencesAction(
  preferences: PreferenceMap,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await apiFetch('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  } catch (error) {
    return { ok: false, message: (error as { message?: string })?.message };
  }
  return { ok: true };
}
