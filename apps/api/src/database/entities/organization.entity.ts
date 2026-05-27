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

  @Column({ name: 'external_reference', type: 'varchar', length: 80, nullable: true })
  externalReference!: string | null;

  @Column({ name: 'address_line', type: 'varchar', length: 200, nullable: true })
  addressLine!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  country!: string | null;

  @Column({ name: 'primary_contact_email', type: 'varchar', length: 254, nullable: true })
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
