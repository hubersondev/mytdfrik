import { DataSource } from 'typeorm';
import { Role, ROLE_CODES } from '../entities';
import type { RoleScope } from '../entities';

/**
 * Seed des rôles socle (CDC §2, ADR-004).
 *
 * Depuis l'ADR-004 la table est dynamique ; ces 5 rôles servent de socle et
 * restent éditables par l'Admin — sauf ADMIN (`isSystem`, non supprimable,
 * toutes permissions). Idempotent : upsert sur l'id, ne touche pas `is_active`.
 */
const ROLES: Array<{
  id: (typeof ROLE_CODES)[number];
  label: string;
  description: string;
  scope: RoleScope;
  isSystem: boolean;
}> = [
  {
    id: 'CLIENT',
    label: 'Client',
    description:
      'Soumet ses demandes, suit leur état, échange avec son interlocuteur et évalue le service rendu.',
    scope: 'CLIENT',
    isSystem: false,
  },
  {
    id: 'GESTIONNAIRE',
    label: 'Gestionnaire',
    description:
      'Réceptionne les demandes, les qualifie, fixe la priorité et les affecte au responsable adéquat.',
    scope: 'INTERNAL',
    isSystem: false,
  },
  {
    id: 'RESPONSABLE',
    label: 'Responsable',
    description:
      'Traite la demande affectée, communique avec le client, met à jour le statut et clôture le dossier.',
    scope: 'INTERNAL',
    isSystem: false,
  },
  {
    id: 'ADMIN',
    label: 'Administrateur',
    description:
      'Gère les utilisateurs, les rôles, le catalogue et les paramètres système. Dispose de toutes les permissions.',
    scope: 'INTERNAL',
    isSystem: true,
  },
  {
    id: 'DG',
    label: 'Direction Générale',
    description:
      'Consulte les tableaux de bord, les indicateurs de performance et les rapports stratégiques.',
    scope: 'INTERNAL',
    isSystem: false,
  },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Role);
  for (const role of ROLES) {
    await repo.upsert(role, ['id']);
  }
}
