import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Request } from './request.entity';

/** Résultat de reproduction d'un bug par le Responsable (CDC §6.3.2). */
export type IsReproducedValue = 'OUI' | 'NON' | 'PARTIEL' | 'NON_TESTE';

export const IS_REPRODUCED_VALUES: readonly IsReproducedValue[] = [
  'OUI',
  'NON',
  'PARTIEL',
  'NON_TESTE',
];

/**
 * Détails structurés d'un bug (CDC §6.2.1, modèle §8.4.7).
 *
 * Relation 1-1 avec `requests` (la PK EST le request_id), présente uniquement
 * quand la catégorie porte `requires_bug_details = true`. Les champs de
 * diagnostic (is_reproduced, root_cause, …) sont renseignés par le Responsable
 * avant la proposition de résolution (T11).
 */
@Entity({ name: 'request_bug_details' })
export class RequestBugDetail {
  @PrimaryColumn({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @OneToOne(() => Request, { eager: false })
  @JoinColumn({ name: 'request_id' })
  request!: Request;

  // -------- Saisie Client (création) --------

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @OneToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'product_version', type: 'varchar', length: 60 })
  productVersion!: string;

  @Column({ name: 'expected_behavior', type: 'text' })
  expectedBehavior!: string;

  @Column({ name: 'observed_behavior', type: 'text' })
  observedBehavior!: string;

  @Column({ name: 'reproduction_steps', type: 'text' })
  reproductionSteps!: string;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ name: 'is_recurrent', type: 'boolean' })
  isRecurrent!: boolean;

  @Column({
    name: 'frequency_label',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  frequencyLabel!: string | null;

  @Column({
    name: 'environment_os',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  environmentOs!: string | null;

  @Column({
    name: 'environment_browser',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  environmentBrowser!: string | null;

  @Column({
    name: 'environment_hardware',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  environmentHardware!: string | null;

  @Column({ name: 'is_blocking', type: 'boolean' })
  isBlocking!: boolean;

  @Column({ name: 'error_messages', type: 'text', nullable: true })
  errorMessages!: string | null;

  // -------- Diagnostic Responsable (avant T11) --------

  @Column({
    name: 'is_reproduced',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  isReproduced!: IsReproducedValue | null;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause!: string | null;

  @Column({ name: 'corrective_action', type: 'text', nullable: true })
  correctiveAction!: string | null;

  @Column({ name: 'workaround', type: 'text', nullable: true })
  workaround!: string | null;

  @Column({ name: 'fix_deployed', type: 'boolean', nullable: true })
  fixDeployed!: boolean | null;

  @Column({ name: 'workaround_only', type: 'boolean', nullable: true })
  workaroundOnly!: boolean | null;

  // -------- Base de connaissances / interop (différé MVP) --------

  @Column({
    name: 'is_knowledge_base_eligible',
    type: 'boolean',
    default: false,
  })
  isKnowledgeBaseEligible!: boolean;

  @Column({
    name: 'external_tracker_ref',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  externalTrackerRef!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
