/**
 * Configuration déclarative des notifications (CDC §7). Pour chaque événement
 * métier : la catégorie de préférence, le libellé in-app, le gabarit courriel
 * éventuel, les destinataires (relatifs à la demande) et le caractère critique
 * (non désactivable [EXG-07-080]).
 */
import type { TemplateCode } from '../mail/templates';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

/** Catégories de préférence (CDC §7.6 [EXG-07-071]). */
export type NotificationCategory =
  | 'CLIENT_ACTIVITY'
  | 'ASSIGNMENTS'
  | 'QUEUE'
  | 'SECURITY'
  | 'ADMIN';

/** Cibles relatives à une demande. */
export type RecipientTarget = 'AUTHOR' | 'ASSIGNEE' | 'GESTIONNAIRES';

export interface RecipientRule {
  target: RecipientTarget;
  /** Le courriel est-il envoyé à cette cible pour cet événement ? */
  email: boolean;
  /** Gabarit courriel spécifique à cette cible (sinon celui de l'événement). */
  emailTemplate?: TemplateCode;
}

export interface NotificationEventDef {
  category: NotificationCategory;
  /** Libellé in-app (cloche / page notifications). */
  inAppLabel: string;
  /** Gabarit courriel (absent = pas d'e-mail pour cet événement). */
  emailTemplate?: TemplateCode;
  recipients: RecipientRule[];
  /** Non désactivable par les préférences (CDC §7.6 [EXG-07-080]). */
  critical?: boolean;
}

export const NOTIFICATION_EVENTS = {
  DEMANDE_CREEE: {
    category: 'QUEUE',
    inAppLabel: 'Nouvelle demande soumise',
    recipients: [{ target: 'GESTIONNAIRES', email: false }],
  },
  DEMANDE_QUALIFIEE: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Votre demande a été qualifiée',
    emailTemplate: 'DEMANDE_QUALIFIEE',
    recipients: [{ target: 'AUTHOR', email: true }],
  },
  COMPLEMENT_DEMANDE: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Un complément vous est demandé',
    emailTemplate: 'COMPLEMENT_DEMANDE',
    recipients: [{ target: 'AUTHOR', email: true }],
  },
  DEMANDE_ANNULEE: {
    category: 'QUEUE',
    inAppLabel: 'Demande annulée par le client',
    recipients: [{ target: 'GESTIONNAIRES', email: false }],
  },
  DEMANDE_REJETEE: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Votre demande a été rejetée',
    emailTemplate: 'DEMANDE_REJETEE',
    recipients: [{ target: 'AUTHOR', email: true }],
  },
  DEMANDE_AFFECTEE: {
    category: 'ASSIGNMENTS',
    inAppLabel: 'Demande affectée',
    recipients: [
      {
        target: 'AUTHOR',
        email: true,
        emailTemplate: 'DEMANDE_AFFECTEE_CLIENT',
      },
      {
        target: 'ASSIGNEE',
        email: true,
        emailTemplate: 'DEMANDE_AFFECTEE_RESPONSABLE',
      },
    ],
  },
  TRAITEMENT_DEMARRE: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Le traitement de votre demande a démarré',
    emailTemplate: 'TRAITEMENT_DEMARRE',
    recipients: [{ target: 'AUTHOR', email: true }],
  },
  AFFECTATION_REFUSEE: {
    category: 'QUEUE',
    inAppLabel: 'Une affectation a été refusée',
    recipients: [{ target: 'GESTIONNAIRES', email: true }],
  },
  REAFFECTATION_DEMANDEE: {
    category: 'QUEUE',
    inAppLabel: 'Une réaffectation est demandée',
    recipients: [{ target: 'GESTIONNAIRES', email: true }],
  },
  CLIENT_A_REPONDU: {
    category: 'ASSIGNMENTS',
    inAppLabel: 'Le client a répondu',
    recipients: [
      { target: 'ASSIGNEE', email: true },
      { target: 'GESTIONNAIRES', email: false },
    ],
  },
  NOUVEAU_MESSAGE_INTERNE: {
    category: 'ASSIGNMENTS',
    inAppLabel: 'Nouveau message interne',
    recipients: [
      { target: 'ASSIGNEE', email: false },
      { target: 'GESTIONNAIRES', email: false },
    ],
  },
  NOUVEAU_MESSAGE_CLIENT: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Nouveau message sur votre demande',
    emailTemplate: 'NOUVEAU_MESSAGE',
    recipients: [{ target: 'AUTHOR', email: true }],
  },
  RESOLUTION_PROPOSEE: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Une résolution vous est proposée',
    emailTemplate: 'RESOLUTION_PROPOSEE',
    recipients: [{ target: 'AUTHOR', email: true }],
  },
  RESOLUTION_REFUSEE: {
    category: 'ASSIGNMENTS',
    inAppLabel: 'Le client a refusé la résolution',
    recipients: [
      { target: 'ASSIGNEE', email: true },
      { target: 'GESTIONNAIRES', email: false },
    ],
  },
  DEMANDE_CLOTUREE: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Votre demande est clôturée',
    emailTemplate: 'DEMANDE_CLOTUREE',
    recipients: [{ target: 'AUTHOR', email: true }],
  },
  DEMANDE_CLOTUREE_AUTO: {
    category: 'CLIENT_ACTIVITY',
    inAppLabel: 'Demande clôturée automatiquement',
    emailTemplate: 'DEMANDE_CLOTUREE_AUTO',
    recipients: [{ target: 'AUTHOR', email: true }],
    critical: true,
  },
  DEMANDE_REOUVERTE: {
    category: 'QUEUE',
    inAppLabel: 'Demande rouverte par le client',
    emailTemplate: 'DEMANDE_REOUVERTE',
    recipients: [
      { target: 'ASSIGNEE', email: true },
      { target: 'GESTIONNAIRES', email: true },
    ],
  },
  EVALUATION_BASSE: {
    category: 'QUEUE',
    inAppLabel: 'Évaluation basse reçue',
    emailTemplate: 'EVALUATION_BASSE',
    recipients: [{ target: 'GESTIONNAIRES', email: true }],
  },
} as const satisfies Record<string, NotificationEventDef>;

export type NotificationEventCode = keyof typeof NOTIFICATION_EVENTS;

export function isNotificationEvent(
  code: string,
): code is NotificationEventCode {
  return code in NOTIFICATION_EVENTS;
}

/** Permission qui identifie les Gestionnaires destinataires de la file. */
export const GESTIONNAIRE_PERMISSION = 'requests.qualify';

/** Nom de l'événement interne (EventEmitter2) consommé par le module notifications. */
export const NOTIFY_EVENT = 'notify';

export interface NotifyEventPayload {
  eventCode: NotificationEventCode;
  requestId?: string | null;
  actorUserId?: string | null;
  actionSummary?: string;
}
