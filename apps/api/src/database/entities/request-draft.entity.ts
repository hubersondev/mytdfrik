import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Brouillon de demande — sauvegardé automatiquement entre les étapes du
 * formulaire de soumission Client (CDC §3.4 [EXG-03-021]).
 *
 * Un Client peut avoir plusieurs brouillons en cours. Les brouillons sont
 * purgés après 30 jours d'inactivité par un job planifié (S5+).
 */
@Entity({ name: 'request_drafts' })
@Index('request_drafts_owner_idx', ['ownerUserId'])
@Index('request_drafts_updated_idx', ['updatedAt'])
export class RequestDraft {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_user_id', type: 'uuid' })
  ownerUserId!: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  /**
   * Payload partiel du formulaire — `category_code`, `title`, `description`,
   * `impact`, `urgency`, `client_context_note`, etc. Validé en JSON Schema
   * côté serveur uniquement à la soumission finale.
   */
  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'step', type: 'smallint', default: 0 })
  step!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
