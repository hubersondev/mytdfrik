import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Request } from './request.entity';
import { User } from './user.entity';

/** Contenu in-app fusionné d'une notification (CDC §7). */
export interface NotificationPayload {
  title: string;
  /** Texte court affiché dans la cloche / page notifications. */
  body: string;
  /** Lien relatif vers la ressource concernée (ex. /client/requests/MTF-…). */
  url: string | null;
  /** Référence publique de la demande, si applicable. */
  publicReference?: string;
}

/**
 * Notification destinée à un utilisateur (CDC §7, modèle §8.4.14).
 * Le canal IN_APP vit ici ; les tentatives d'envoi par canal sont tracées
 * dans `notification_deliveries`.
 */
@Entity({ name: 'notifications' })
@Index('notifications_recipient_unread_idx', [
  'recipientUserId',
  'isReadInApp',
  'createdAt',
])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_code', type: 'varchar', length: 80 })
  eventCode!: string;

  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId!: string | null;

  @ManyToOne(() => Request, { eager: false, nullable: true })
  @JoinColumn({ name: 'request_id' })
  request!: Request | null;

  @Column({ name: 'recipient_user_id', type: 'uuid' })
  recipientUserId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'recipient_user_id' })
  recipient!: User;

  @Column({ type: 'jsonb' })
  payload!: NotificationPayload;

  @Column({ name: 'is_critical', type: 'boolean', default: false })
  isCritical!: boolean;

  @Column({ name: 'is_read_in_app', type: 'boolean', default: false })
  isReadInApp!: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
