import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { RoleCode } from './role.entity';

/**
 * Journal d'audit immuable (CDC §3.13 M15, §8.4.16, §10.6).
 *
 * Append-only : aucune mise à jour ni suppression n'est autorisée.
 * Conservation 5 ans glissants (§10.6 [EXG-10-112]).
 *
 * Le partitionnement par mois (occurredAt) sera ajouté quand la table
 * dépassera ~10M lignes (§8.6 [EXG-08-035]).
 */
@Entity({ name: 'audit_log' })
@Index('audit_log_occurred_at_idx', ['occurredAt'])
@Index('audit_log_actor_idx', ['actorUserId'])
@Index('audit_log_object_idx', ['objectType', 'objectId'])
@Index('audit_log_action_idx', ['actionCode'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 20, nullable: true })
  actorRole!: RoleCode | null;

  @Column({ name: 'action_code', type: 'varchar', length: 80 })
  actionCode!: string;

  @Column({ name: 'object_type', type: 'varchar', length: 40 })
  objectType!: string;

  @Column({ name: 'object_id', type: 'varchar', length: 80, nullable: true })
  objectId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ name: 'client_ip', type: 'varchar', length: 64, nullable: true })
  clientIp!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({
    name: 'request_id_correlation',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  requestIdCorrelation!: string | null;
}
