import { DataSource } from 'typeorm';
import { PriorityLevel, PRIORITY_LEVEL_CODES } from '../entities';

/**
 * Seed des 5 niveaux de priorité avec SLA proposés (CDC §5.6).
 *
 * Les délais sont exprimés en minutes :
 *   P0 (Bloquant)  : 30 min prise en charge | 4 h résolution  (24/7)
 *   P1 (Critique)  : 2 h | 1 j ouvré
 *   P2 (Haute)     : 4 h | 3 j ouvrés
 *   P3 (Normale)   : 1 j ouvré | 5 j ouvrés
 *   P4 (Basse)     : 3 j ouvrés | 15 j ouvrés
 *
 * Note : 1 jour ouvré = 10 h (8h-18h). Les calculs réels d'heures ouvrées
 * sont gérés dans le service de priorisation (sprint 5).
 *
 * Idempotent : upsert sur l'id pour préserver les ajustements DG.
 */
const LEVELS: Array<{
  id: (typeof PRIORITY_LEVEL_CODES)[number];
  label: string;
  description: string;
  slaFirstResponseMinutes: number;
  slaResolutionMinutes: number;
  is24x7: boolean;
}> = [
  {
    id: 'P0',
    label: 'Bloquant',
    description:
      "Crise. Mobilisation immédiate, escalade automatique au Gestionnaire et à l'équipe d'astreinte 24/7.",
    slaFirstResponseMinutes: 30,
    slaResolutionMinutes: 240, // 4 h calendaires
    is24x7: true,
  },
  {
    id: 'P1',
    label: 'Critique',
    description:
      'Très haute priorité. Traitement prioritaire en heures ouvrées.',
    slaFirstResponseMinutes: 120, // 2 h ouvrées
    slaResolutionMinutes: 600, // 1 j ouvré (10 h)
    is24x7: false,
  },
  {
    id: 'P2',
    label: 'Haute',
    description:
      'Priorité élevée. Doit être traité avant les demandes routinières.',
    slaFirstResponseMinutes: 240, // 4 h ouvrées
    slaResolutionMinutes: 1800, // 3 j ouvrés
    is24x7: false,
  },
  {
    id: 'P3',
    label: 'Normale',
    description:
      'Priorité courante. Traitement dans le cours normal des activités.',
    slaFirstResponseMinutes: 600, // 1 j ouvré
    slaResolutionMinutes: 3000, // 5 j ouvrés
    is24x7: false,
  },
  {
    id: 'P4',
    label: 'Basse',
    description: 'Faible priorité. Traitement quand la charge le permet.',
    slaFirstResponseMinutes: 1800, // 3 j ouvrés
    slaResolutionMinutes: 9000, // 15 j ouvrés
    is24x7: false,
  },
];

export async function seedPriorityLevels(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(PriorityLevel);
  for (const level of LEVELS) {
    const existing = await repo.findOne({ where: { id: level.id } });
    if (existing) {
      // Préserve les overrides DG sur les SLA — ne réécrase que label et description
      await repo.update(level.id, {
        label: level.label,
        description: level.description,
      });
    } else {
      await repo.insert(level);
    }
  }
}
