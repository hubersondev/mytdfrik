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
import { PriorityLevel } from './priority-level.entity';
import type { PriorityLevelCode } from './priority-level.entity';

/**
 * Catégorie de demande (CDC §3.5, §8.4.4).
 *
 * Le catalogue initial est défini en annexe A3 du CDC. Il est entièrement
 * éditable par l'Administrateur sans déploiement.
 *
 * Chaque catégorie :
 * - porte une priorité par défaut (default_priority_id) appliquée si la
 *   matrice Impact × Urgence donne un résultat moins prioritaire (CDC §5.4.1).
 * - peut déclencher l'affichage du formulaire structuré de signalement de bug
 *   (requires_bug_details = true, voir CDC §6.2).
 * - peut être réservée à certains clients (is_reserved, V2).
 */
@Entity({ name: 'categories' })
@Index('categories_code_idx', ['code'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('categories_active_idx', ['isActive'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 40 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'default_priority_id', type: 'varchar', length: 5 })
  defaultPriorityId!: PriorityLevelCode;

  @ManyToOne(() => PriorityLevel, { eager: false })
  @JoinColumn({ name: 'default_priority_id' })
  defaultPriority!: PriorityLevel;

  @Column({ name: 'requires_bug_details', type: 'boolean', default: false })
  requiresBugDetails!: boolean;

  @Column({
    name: 'default_responsible_team',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  defaultResponsibleTeam!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_reserved', type: 'boolean', default: false })
  isReserved!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
