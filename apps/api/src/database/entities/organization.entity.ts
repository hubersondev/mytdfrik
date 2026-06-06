import {
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
import { City } from './city.entity';
import { Country } from './country.entity';
import { User } from './user.entity';

/**
 * Organisation cliente de TECHDIFRIK.
 * Une organisation regroupe un ou plusieurs comptes Client (CDC §2.2.1, §8.4.1).
 */
@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({
    name: 'external_reference',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  externalReference!: string | null;

  @Column({
    name: 'address_line',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  addressLine!: string | null;

  @Column({ name: 'country_id', type: 'uuid', nullable: true })
  countryId!: string | null;

  @ManyToOne(() => Country, { eager: false, nullable: true })
  @JoinColumn({ name: 'country_id' })
  country!: Country | null;

  @Column({ name: 'city_id', type: 'uuid', nullable: true })
  cityId!: string | null;

  @ManyToOne(() => City, { eager: false, nullable: true })
  @JoinColumn({ name: 'city_id' })
  city!: City | null;

  @Column({
    name: 'primary_contact_email',
    type: 'varchar',
    length: 254,
    nullable: true,
  })
  primaryContactEmail!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
