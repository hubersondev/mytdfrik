/** Domaine « Notifications » côté front (CDC §7). Aligné sur l'API `/notifications`. */

export interface NotificationPayload {
  title: string;
  body: string;
  url: string | null;
  publicReference?: string;
}

export interface NotificationView {
  id: string;
  eventCode: string;
  requestId: string | null;
  payload: NotificationPayload;
  isCritical: boolean;
  isReadInApp: boolean;
  readAt: string | null;
  createdAt: string;
}

/** Catégories de préférence (CDC §7.6) avec libellés FR pour l'écran de réglages. */
export const PREFERENCE_CATEGORIES = [
  { key: 'CLIENT_ACTIVITY', label: 'Activité sur mes demandes' },
  { key: 'ASSIGNMENTS', label: 'Affectations et mises à jour' },
  { key: 'QUEUE', label: "File d'attente et gestion" },
  { key: 'ADMIN', label: 'Administration' },
] as const;

export type PreferenceMap = Record<string, { IN_APP?: boolean; EMAIL?: boolean }>;

/**
 * Origine WebSocket de l'API (sans le préfixe /api/v1). Lue depuis
 * NEXT_PUBLIC_API_URL (disponible côté navigateur).
 */
export function apiWsOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  return base.replace(/\/api\/v1\/?$/, '');
}
