import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Request } from './request.entity';
import { User } from './user.entity';

/**
 * Évaluation de satisfaction d'une demande clôturée (CDC §8.4.12).
 *
 * Relation 1-1 avec `requests` (la PK EST le request_id). Proposée au Client à
 * la clôture (T16) ; score 1-5 + commentaire optionnel.
 */
@Entity({ name: 'evaluations' })
export class Evaluation {
  @PrimaryColumn({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @OneToOne(() => Request, { eager: false })
  @JoinColumn({ name: 'request_id' })
  request!: Request;

  @Column({ name: 'score', type: 'smallint' })
  score!: number;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'submitted_by_user_id', type: 'uuid' })
  submittedByUserId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'submitted_by_user_id' })
  submittedBy!: User;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;
}
