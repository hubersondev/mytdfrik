import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Référentiel fixe des cinq niveaux de priorité (CDC §5.3, §8.4.5).
 * Cette table contient toujours exactement 5 lignes seedées au démarrage :
 * P0 (Bloquant), P1 (Critique), P2 (Haute), P3 (Normale), P4 (Basse).
 *
 * Les SLA (en minutes) sont paramétrables par l'Administrateur sur
 * validation de la Direction Générale (CDC §5.6, [EXG-05-060..072]).
 */
export const PRIORITY_LEVEL_CODES = ['P0', 'P1', 'P2', 'P3', 'P4'] as const;
export type PriorityLevelCode = (typeof PRIORITY_LEVEL_CODES)[number];

@Entity({ name: 'priority_levels' })
export class PriorityLevel {
  @PrimaryColumn({ type: 'varchar', length: 5 })
  id!: PriorityLevelCode;

  @Column({ type: 'varchar', length: 40 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'sla_first_response_minutes', type: 'integer' })
  slaFirstResponseMinutes!: number;

  @Column({ name: 'sla_resolution_minutes', type: 'integer' })
  slaResolutionMinutes!: number;

  @Column({ name: 'is_24x7', type: 'boolean', default: false })
  is24x7!: boolean;
}
