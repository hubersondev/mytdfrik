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
import { RequestMessage } from './request-message.entity';
import { User } from './user.entity';

/** Statut d'analyse antivirus d'une pièce jointe (CDC §3.8 [EXG-03-063]). */
export type AntivirusStatus = 'PENDING' | 'CLEAN' | 'INFECTED' | 'ERROR';

/**
 * Pièce jointe d'une demande (CDC §3.8, entité 10 du modèle de données).
 *
 * Entité append-only : jamais supprimée par son auteur, seulement marquée
 * « retirée » avec motif [EXG-03-065]. Le binaire vit dans un stockage objet
 * (S3-compatible) ou sur disque en dev ; seules les métadonnées sont en base.
 */
@Entity({ name: 'request_attachments' })
@Index('request_attachments_request_idx', ['requestId', 'createdAt'])
export class RequestAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @ManyToOne(() => Request, { eager: false })
  @JoinColumn({ name: 'request_id' })
  request!: Request;

  @Column({ name: 'message_id', type: 'uuid', nullable: true })
  messageId!: string | null;

  @ManyToOne(() => RequestMessage, { eager: false, nullable: true })
  @JoinColumn({ name: 'message_id' })
  message!: RequestMessage | null;

  @Column({ name: 'uploaded_by_user_id', type: 'uuid' })
  uploadedByUserId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploadedBy!: User;

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Column({ name: 'storage_bucket', type: 'varchar', length: 120 })
  storageBucket!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey!: string;

  @Column({
    name: 'storage_etag',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  storageEtag!: string | null;

  @Column({ name: 'antivirus_status', type: 'varchar', length: 20 })
  antivirusStatus!: AntivirusStatus;

  @Column({ name: 'antivirus_checked_at', type: 'timestamptz', nullable: true })
  antivirusCheckedAt!: Date | null;

  @Column({ name: 'is_withdrawn', type: 'boolean', default: false })
  isWithdrawn!: boolean;

  @Column({
    name: 'withdrawal_reason',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  withdrawalReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
