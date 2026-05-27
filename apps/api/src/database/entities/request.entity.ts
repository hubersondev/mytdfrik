import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Organization } from './organization.entity';
import { PriorityLevel } from './priority-level.entity';
import type { PriorityLevelCode } from './priority-level.entity';
import { User } from './user.entity';

/** Impact métier déclaré par le Client (CDC §5.2.2). */
export const IMPACT_VALUES = [
  'BLOCAGE_TOTAL',
  'BLOCAGE_PARTIEL',
  'DEGRADATION',
  'AUCUN_IMPACT',
] as const;
export type ImpactValue = (typeof IMPACT_VALUES)[number];

/** Urgence métier déclarée par le Client (CDC §5.2.3). */
export const URGENCY_VALUES = [
  'CRITIQUE',
  'ELEVEE',
  'MODEREE',
  'FAIBLE',
] as const;
export type UrgencyValue = (typeof URGENCY_VALUES)[number];

/** Statuts de la machine à états (CDC §4.1). Sprint 3 ne crée que NOUVELLE ;
 *  les autres statuts sont câblés dans les sprints suivants. */
export const REQUEST_STATUS_VALUES = [
  'NOUVELLE',
  'EN_ATTENTE_AFFECTATION',
  'AFFECTEE',
  'EN_COURS',
  'EN_ATTENTE_CLIENT',
  'RESOLUE',
  'CLOTUREE',
  'ANNULEE',
] as const;
export type RequestStatus = (typeof REQUEST_STATUS_VALUES)[number];

/**
 * Demande client — entité centrale du domaine (CDC §8.4.6).
 *
 * L'identifiant public `MTF-AAAAMMJJ-NNNN` est généré par séquence atomique
 * côté DB et stocké séparément de l'`id` UUID interne. Il est communiqué au
 * Client à la soumission et reste stable pour toute la vie de la demande,
 * y compris en cas de réouverture.
 */
@Entity({ name: 'requests' })
@Index('requests_public_ref_idx', ['publicReference'], { unique: true })
@Index('requests_status_priority_created_idx', [
  'status',
  'effectivePriorityId',
  'createdAt',
])
@Index('requests_organization_created_idx', ['organizationId', 'createdAt'])
@Index('requests_assigned_status_idx', ['assignedToUserId', 'status'])
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'public_reference', type: 'varchar', length: 20 })
  publicReference!: string;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, { eager: false })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 20 })
  impact!: ImpactValue;

  @Column({ type: 'varchar', length: 20 })
  urgency!: UrgencyValue;

  @Column({
    name: 'client_context_note',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  clientContextNote!: string | null;

  @Column({ name: 'system_priority_id', type: 'varchar', length: 5 })
  systemPriorityId!: PriorityLevelCode;

  @ManyToOne(() => PriorityLevel, { eager: false })
  @JoinColumn({ name: 'system_priority_id' })
  systemPriority!: PriorityLevel;

  @Column({ name: 'effective_priority_id', type: 'varchar', length: 5 })
  effectivePriorityId!: PriorityLevelCode;

  @ManyToOne(() => PriorityLevel, { eager: false })
  @JoinColumn({ name: 'effective_priority_id' })
  effectivePriority!: PriorityLevel;

  @Column({ name: 'priority_override_reason', type: 'text', nullable: true })
  priorityOverrideReason!: string | null;

  @Column({ type: 'varchar', length: 40 })
  status!: RequestStatus;

  @Column({
    name: 'previous_status_before_wait',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  previousStatusBeforeWait!: RequestStatus | null;

  @Column({ name: 'assigned_to_user_id', type: 'uuid', nullable: true })
  assignedToUserId!: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assignedTo!: User | null;

  @Column({ name: 'assigned_by_user_id', type: 'uuid', nullable: true })
  assignedByUserId!: string | null;

  @Column({ name: 'qualified_by_user_id', type: 'uuid', nullable: true })
  qualifiedByUserId!: string | null;

  @Column({ name: 'reopen_count', type: 'smallint', default: 0 })
  reopenCount!: number;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason!: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  // ---- Horodatages métier (CDC §4.5) ----

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'qualified_at', type: 'timestamptz', nullable: true })
  qualifiedAt!: Date | null;

  @Column({ name: 'first_response_at', type: 'timestamptz', nullable: true })
  firstResponseAt!: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'last_reopened_at', type: 'timestamptz', nullable: true })
  lastReopenedAt!: Date | null;

  @Column({ name: 'waiting_client_total_ms', type: 'bigint', default: 0 })
  waitingClientTotalMs!: string;

  @Column({
    name: 'sla_due_first_response_at',
    type: 'timestamptz',
    nullable: true,
  })
  slaDueFirstResponseAt!: Date | null;

  @Column({
    name: 'sla_due_resolution_at',
    type: 'timestamptz',
    nullable: true,
  })
  slaDueResolutionAt!: Date | null;

  @Column({
    name: 'is_sla_first_response_respected',
    type: 'boolean',
    nullable: true,
  })
  isSlaFirstResponseRespected!: boolean | null;

  @Column({
    name: 'is_sla_resolution_respected',
    type: 'boolean',
    nullable: true,
  })
  isSlaResolutionRespected!: boolean | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
