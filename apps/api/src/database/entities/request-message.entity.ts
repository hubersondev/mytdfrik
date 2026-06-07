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

/**
 * Message échangé sur une demande (CDC §3.7, §8.4.10). Non éditable après envoi :
 * peut être marqué « Retiré par l'auteur » (le corps reste consultable par
 * l'Administrateur via le journal d'audit). Les messages internes ne sont pas
 * visibles du Client.
 */
@Entity({ name: 'request_messages' })
@Index('request_messages_request_idx', ['requestId', 'createdAt'])
export class RequestMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @ManyToOne(() => Request, { eager: false })
  @JoinColumn({ name: 'request_id' })
  request!: Request;

  @Column({ name: 'author_user_id', type: 'uuid' })
  authorUserId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'author_user_id' })
  author!: User;

  /** Markdown limité (gras, italique, listes, liens, blocs de code). */
  @Column({ type: 'text' })
  body!: string;

  /** Message interne Gestionnaire/Responsable, non visible du Client. */
  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal!: boolean;

  @Column({ name: 'is_withdrawn', type: 'boolean', default: false })
  isWithdrawn!: boolean;

  @Column({ name: 'withdrawn_at', type: 'timestamptz', nullable: true })
  withdrawnAt!: Date | null;

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
