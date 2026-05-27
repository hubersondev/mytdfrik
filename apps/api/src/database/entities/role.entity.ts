import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * Référentiel fixe des cinq rôles MyTDFRIK (CDC §2, §8.4.2).
 * Cette table contient toujours exactement 5 lignes, seedées au démarrage.
 */
export const ROLE_CODES = [
  'CLIENT',
  'GESTIONNAIRE',
  'RESPONSABLE',
  'ADMIN',
  'DG',
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

@Entity({ name: 'roles' })
export class Role {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id!: RoleCode;

  @Column({ type: 'varchar', length: 80 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
