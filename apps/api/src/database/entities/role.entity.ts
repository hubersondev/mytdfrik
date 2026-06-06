import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { User } from './user.entity';

/**
 * Codes des rôles **socle** seedés au démarrage (CDC §2, ADR-004).
 * Depuis l'ADR-004, la table `roles` est dynamique : l'Administrateur peut
 * créer/éditer/supprimer des rôles. Seul `ADMIN` est figé (`is_system`).
 * Ces codes restent utiles comme référence de seed et valeurs de bootstrap.
 */
export const ROLE_CODES = [
  'CLIENT',
  'GESTIONNAIRE',
  'RESPONSABLE',
  'ADMIN',
  'DG',
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

/** Portail auquel un rôle donne accès. */
export const ROLE_SCOPES = ['INTERNAL', 'CLIENT'] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];

@Entity({ name: 'roles' })
export class Role {
  /** Code stable (slug MAJUSCULE), immuable après création. Sert de PK et de FK. */
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Portail : INTERNAL (admin) ou CLIENT. */
  @Column({ type: 'varchar', length: 10 })
  scope!: RoleScope;

  /** Rôle système non supprimable (ADMIN). Bypass total des permissions. */
  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  permissions!: RolePermission[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
