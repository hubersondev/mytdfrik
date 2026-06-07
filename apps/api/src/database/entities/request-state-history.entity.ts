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
 * Journal append-only des transitions d'une demande (CDC §4.3 [EXG-04-001]).
 * Conserve la trace complète indépendamment du statut courant. Les mutations
 * (UPDATE/DELETE) sont bloquées par trigger côté DB (comme audit_log).
 */
@Entity({ name: 'request_state_history' })
@Index('request_state_history_request_idx', ['requestId', 'createdAt'])
export class RequestStateHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @ManyToOne(() => Request, { eager: false })
  @JoinColumn({ name: 'request_id' })
  request!: Request;

  /** Code de transition « réel » (T02, T13, …) tel que journalisé. */
  @Column({ name: 'transition_code', type: 'varchar', length: 20 })
  transitionCode!: string;

  @Column({ name: 'from_status', type: 'varchar', length: 40 })
  fromStatus!: string;

  @Column({ name: 'to_status', type: 'varchar', length: 40 })
  toStatus!: string;

  /** Acteur (null si déclenché par le système). */
  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'actor_user_id' })
  actor!: User | null;

  /** Motif / message / résumé de résolution selon la transition. */
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  /** Événement métier émis (CDC §4.8). */
  @Column({ type: 'varchar', length: 40 })
  event!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
