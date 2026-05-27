import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Role } from './role.entity';
import type { RoleCode } from './role.entity';
import { Session } from './session.entity';

/**
 * Statut de l'adresse email — utilisé par §7.4.4 du CDC (gestion des bounces).
 */
export type EmailStatus = 'VALID' | 'INVALID';

/**
 * Compte utilisateur tous rôles confondus (CDC §8.4.3).
 *
 * Contraintes :
 * - Un Client est obligatoirement rattaché à une organisation.
 * - Le champ email est unique de manière insensible à la casse (index fonctionnel,
 *   créé dans la migration initiale via raw SQL).
 */
@Entity({ name: 'users' })
@Check(`"role_id" <> 'CLIENT' OR "organization_id" IS NOT NULL`)
@Index('users_role_active_idx', ['roleId', 'isActive'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({
    name: 'email_status',
    type: 'varchar',
    length: 10,
    default: 'VALID',
  })
  emailStatus!: EmailStatus;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 120 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 120 })
  lastName!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'role_id', type: 'varchar', length: 20 })
  roleId!: RoleCode;

  @ManyToOne(() => Role, (role) => role.users, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @ManyToOne(() => Organization, (org) => org.users, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'failed_login_count', type: 'smallint', default: 0 })
  failedLoginCount!: number;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({
    name: 'last_password_changed_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastPasswordChangedAt!: Date | null;

  @Column({
    name: 'time_zone',
    type: 'varchar',
    length: 64,
    default: 'Africa/Abidjan',
  })
  timeZone!: string;

  @Column({ name: 'notification_preferences', type: 'jsonb', nullable: true })
  notificationPreferences!: Record<string, unknown> | null;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
