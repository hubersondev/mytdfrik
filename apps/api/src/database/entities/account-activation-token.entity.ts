import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Jeton d'activation de compte (CDC §3.3 [EXG-03-010]).
 *
 * Émis lors de la création d'un compte par l'Administrateur ; permet au titulaire
 * de définir son premier mot de passe. Validité 72 heures.
 */
@Entity({ name: 'account_activation_tokens' })
@Index('account_activation_tokens_user_idx', ['userId'])
@Index('account_activation_tokens_hash_idx', ['tokenHash'], { unique: true })
export class AccountActivationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'token_hash', type: 'varchar', length: 128 })
  tokenHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;
}
