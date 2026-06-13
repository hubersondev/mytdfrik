import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notification } from './notification.entity';

export type DeliveryChannel = 'IN_APP' | 'EMAIL' | 'WEB_PUSH_REALTIME';
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';

/**
 * Tentative d'envoi d'une notification sur un canal (CDC §7.7 [EXG-07-101]).
 * Trace le statut et les tentatives pour l'observabilité et le retry.
 */
@Entity({ name: 'notification_deliveries' })
@Index('notification_deliveries_notification_idx', ['notificationId'])
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'notification_id', type: 'uuid' })
  notificationId!: string;

  @ManyToOne(() => Notification, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification!: Notification;

  @Column({ type: 'varchar', length: 20 })
  channel!: DeliveryChannel;

  @Column({ type: 'varchar', length: 20 })
  status!: DeliveryStatus;

  @Column({ type: 'smallint', default: 0 })
  attempts!: number;

  @Column({ name: 'last_attempt_at', type: 'timestamptz', nullable: true })
  lastAttemptAt!: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({
    name: 'provider_message_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerMessageId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
