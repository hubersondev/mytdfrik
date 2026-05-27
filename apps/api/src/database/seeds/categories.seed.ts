import { DataSource } from 'typeorm';
import { Category } from '../entities';
import type { PriorityLevelCode } from '../entities';

/**
 * Catalogue initial des catégories de demandes (CDC annexe A3).
 *
 * Idempotent : créé uniquement si le code n'existe pas. Les modifications
 * ultérieures par l'Administrateur via l'API sont préservées.
 */
const CATEGORIES: Array<{
  code: string;
  label: string;
  description: string;
  defaultPriorityId: PriorityLevelCode;
  requiresBugDetails: boolean;
  defaultResponsibleTeam: string;
}> = [
  // ---------- Techniques ----------
  {
    code: 'BUG_BLOCANT',
    label: "Signalement d'un bug bloquant",
    description:
      "Dysfonctionnement qui empêche l'utilisation d'un produit ou service.",
    defaultPriorityId: 'P1',
    requiresBugDetails: true,
    defaultResponsibleTeam: 'Support technique',
  },
  {
    code: 'BUG_NON_BLOCANT',
    label: "Signalement d'un bug non bloquant",
    description: 'Dysfonctionnement gênant mais contournable.',
    defaultPriorityId: 'P3',
    requiresBugDetails: true,
    defaultResponsibleTeam: 'Support technique',
  },
  {
    code: 'PANNE',
    label: 'Panne ou indisponibilité',
    description: 'Service ou produit totalement indisponible.',
    defaultPriorityId: 'P1',
    requiresBugDetails: true,
    defaultResponsibleTeam: 'Support technique',
  },
  {
    code: 'INCIDENT_SECURITE',
    label: 'Incident de sécurité',
    description: 'Faille, intrusion ou comportement suspect détecté.',
    defaultPriorityId: 'P0',
    requiresBugDetails: true,
    defaultResponsibleTeam: 'Sécurité & IT',
  },
  {
    code: 'DEMANDE_TECHNIQUE',
    label: 'Question technique sur un produit',
    description: "Demande d'assistance technique non liée à un bug.",
    defaultPriorityId: 'P3',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Support technique',
  },
  // ---------- Fonctionnelles ----------
  {
    code: 'DEMANDE_INFORMATION',
    label: "Demande d'information",
    description: 'Question fonctionnelle, demande de précision sur un service.',
    defaultPriorityId: 'P3',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Support fonctionnel',
  },
  {
    code: 'DEMANDE_DOCUMENTATION',
    label: 'Demande de documentation',
    description: "Demande d'envoi ou de mise à disposition de documents.",
    defaultPriorityId: 'P4',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Support fonctionnel',
  },
  {
    code: 'EVOLUTION',
    label: "Demande d'évolution / nouvelle fonctionnalité",
    description: "Proposition d'amélioration ou besoin nouveau.",
    defaultPriorityId: 'P4',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Comité produit',
  },
  {
    code: 'FORMATION',
    label: "Demande de formation ou d'accompagnement",
    description:
      "Sollicitation d'une session de formation ou d'un accompagnement.",
    defaultPriorityId: 'P4',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Service formation',
  },
  // ---------- Commerciales / administratives ----------
  {
    code: 'RECLAMATION',
    label: 'Réclamation commerciale',
    description: 'Insatisfaction client nécessitant un traitement formel.',
    defaultPriorityId: 'P2',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Direction commerciale',
  },
  {
    code: 'DEMANDE_DEVIS',
    label: 'Demande de devis',
    description: "Demande d'offre commerciale.",
    defaultPriorityId: 'P3',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Service commercial',
  },
  {
    code: 'FACTURATION',
    label: 'Question liée à la facturation',
    description: 'Question ou contestation sur une facture.',
    defaultPriorityId: 'P3',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Service comptable',
  },
  {
    code: 'RESILIATION',
    label: 'Demande de résiliation ou modification de contrat',
    description: 'Évolution contractuelle, fin de service.',
    defaultPriorityId: 'P2',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Direction commerciale',
  },
  // ---------- Générique ----------
  {
    code: 'AUTRE',
    label: 'Autre demande',
    description: 'Toute demande ne correspondant pas aux catégories ci-dessus.',
    defaultPriorityId: 'P3',
    requiresBugDetails: false,
    defaultResponsibleTeam: 'Support fonctionnel',
  },
];

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Category);
  for (const cat of CATEGORIES) {
    const existing = await repo.findOne({ where: { code: cat.code } });
    if (!existing) {
      await repo.insert(cat);
    }
  }
}
