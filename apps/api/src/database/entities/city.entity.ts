import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Country } from './country.entity';

/**
 * Ville de référence rattachée à un pays (CDC §8.4.1). Permet le choix de la
 * ville dans un sélecteur dépendant du pays, plutôt qu'une saisie libre.
 *
 * Le référentiel initial (communes de Côte d'Ivoire + grandes villes des pays
 * voisins) est seedé, et reste éditable par l'Admin.
 */
@Entity({ name: 'cities' })
@Index('cities_country_name_idx', ['countryId', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('cities_active_idx', ['isActive'])
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'country_id', type: 'uuid' })
  countryId!: string;

  @ManyToOne(() => Country, (country) => country.cities, { eager: false })
  @JoinColumn({ name: 'country_id' })
  country!: Country;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
