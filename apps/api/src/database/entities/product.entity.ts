import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Produit ou service TECHDIFRIK référencé dans les bugs (CDC §8.4.8, annexe A3).
 *
 * Les flags requires_os / requires_browser conditionnent l'affichage des champs
 * d'environnement dans le formulaire bug du Client (CDC §6.2.1 [EXG-06-010]).
 */
@Entity({ name: 'products' })
@Index('products_code_idx', ['code'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('products_active_idx', ['isActive'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 40 })
  code!: string;

  @Column({ type: 'varchar', length: 160 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'default_owner_team',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  defaultOwnerTeam!: string | null;

  @Column({ name: 'requires_os', type: 'boolean', default: false })
  requiresOs!: boolean;

  @Column({ name: 'requires_browser', type: 'boolean', default: false })
  requiresBrowser!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
