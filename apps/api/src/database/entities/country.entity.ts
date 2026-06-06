import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { City } from './city.entity';

/**
 * Pays de référence (CDC §8.4.1). Sert à normaliser la localisation des
 * organisations clientes via un sélecteur plutôt qu'une saisie libre.
 *
 * `code` suit la norme ISO 3166-1 alpha-2 (ex. CI, FR, SN). Le référentiel
 * initial (CEDEAO + pays fréquents) est seedé, mais reste éditable par l'Admin.
 */
@Entity({ name: 'countries' })
@Index('countries_code_idx', ['code'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('countries_active_idx', ['isActive'])
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 2 })
  code!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => City, (city) => city.country)
  cities!: City[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
