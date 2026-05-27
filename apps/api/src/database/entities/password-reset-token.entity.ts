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
 * Jeton de réinitialisation de mot de passe (CDC §10.2.1 [EXG-10-013]).
 *
 * - token_hash : SHA-256 du secret envoyé par courriel.
 * - expires_at : 30 minutes après création (paramétrable).
 * - used_at : timestamp d'utilisation (un jeton n'est utilisable qu'une seule fois).
 */
@Entity({ name: 'password_reset_tokens' })
@Index('password_reset_tokens_user_idx', ['userId'])
@Index('password_reset_tokens_hash_idx', ['tokenHash'], { unique: true })
export class PasswordResetToken {
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
