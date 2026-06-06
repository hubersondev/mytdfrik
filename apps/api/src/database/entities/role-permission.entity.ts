import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Role } from './role.entity';

/**
 * Attribution d'une permission (du catalogue figé, cf. permissions.catalog.ts)
 * à un rôle (ADR-004). Table de jonction simple : on stocke le **code** de la
 * permission en clair — le catalogue côté code reste la source de vérité, il
 * n'y a donc pas de table `permissions` à synchroniser.
 *
 * L'ADMIN (`role.is_system`) n'a aucune ligne ici : il bénéficie de toutes les
 * permissions implicitement (bypass dans le guard).
 */
@Entity({ name: 'role_permissions' })
export class RolePermission {
  @PrimaryColumn({ name: 'role_id', type: 'varchar', length: 20 })
  roleId!: string;

  @PrimaryColumn({ name: 'permission_code', type: 'varchar', length: 60 })
  permissionCode!: string;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}
