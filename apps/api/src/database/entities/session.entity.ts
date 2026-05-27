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
 * Session active (refresh token) — CDC §8.4.17, §9.3.1, §10.2.3.
 *
 * Le refresh_token_hash est un hash SHA-256 du jeton émis. Le secret en clair
 * n'est jamais stocké en base.
 *
 * Rotation à chaque usage : l'utilisation d'un refresh token rend immédiatement
 * son hash invalide (révocation logique via `revokedAt`). La détection d'une
 * réémission par un refresh token déjà révoqué déclenche la révocation totale
 * de toutes les sessions du même utilisateur (signal de vol).
 */
@Entity({ name: 'sessions' })
@Index('sessions_user_idx', ['userId'])
@Index('sessions_token_hash_idx', ['refreshTokenHash'], { unique: true })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 128 })
  refreshTokenHash!: string;

  @Column({ name: 'client_ip', type: 'varchar', length: 64, nullable: true })
  clientIp!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
