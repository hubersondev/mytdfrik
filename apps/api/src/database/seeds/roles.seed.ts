import { DataSource } from 'typeorm';
import { Role, ROLE_CODES } from '../entities';

/**
 * Seed des 5 rôles fixes — CDC §2.
 * Idempotent : utilise upsert pour conserver les modifications de label/description.
 */
const ROLES: Array<{
  id: (typeof ROLE_CODES)[number];
  label: string;
  description: string;
}> = [
  {
    id: 'CLIENT',
    label: 'Client',
    description:
      'Soumet ses demandes, suit leur état, échange avec son interlocuteur et évalue le service rendu.',
  },
  {
    id: 'GESTIONNAIRE',
    label: 'Gestionnaire',
    description:
      'Réceptionne les demandes, les qualifie, fixe la priorité et les affecte au responsable adéquat.',
  },
  {
    id: 'RESPONSABLE',
    label: 'Responsable',
    description:
      'Traite la demande affectée, communique avec le client, met à jour le statut et clôture le dossier.',
  },
  {
    id: 'ADMIN',
    label: 'Administrateur',
    description:
      "Gère les utilisateurs, les droits d'accès, les catégories de demandes et les paramètres système.",
  },
  {
    id: 'DG',
    label: 'Direction Générale',
    description:
      'Consulte les tableaux de bord, les indicateurs de performance et les rapports stratégiques.',
  },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Role);
  for (const role of ROLES) {
    await repo.upsert(role, ['id']);
  }
}
