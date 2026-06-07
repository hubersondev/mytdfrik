import { DataSource } from 'typeorm';
import { RolePermission } from '../entities';

/**
 * Attributions de permissions par défaut aux rôles socle (ADR-004).
 *
 * - ADMIN : aucune ligne (rôle système → toutes permissions implicitement).
 * - Les autres rôles reçoivent un jeu de départ ; l'Administrateur peut ensuite
 *   l'ajuster via l'interface.
 *
 * Idempotent et **additif** : on insère les attributions manquantes sans
 * dupliquer (ON CONFLICT DO NOTHING). Un re-seed ne supprime pas les
 * permissions ajoutées par l'Admin, mais réintroduit les permissions par
 * défaut éventuellement retirées — comportement attendu d'un seed de bootstrap.
 */
const DEFAULTS: Record<string, string[]> = {
  CLIENT: ['requests.create'],
  GESTIONNAIRE: [
    'requests.read.all',
    'requests.qualify',
    'requests.assign',
    'requests.message',
    'users.read',
    'organizations.read',
  ],
  RESPONSABLE: [
    'requests.read.all',
    'requests.process',
    'requests.close',
    'requests.message',
  ],
  DG: ['requests.read.all', 'audit.read'],
};

export async function seedRolePermissions(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(RolePermission);
  for (const [roleId, codes] of Object.entries(DEFAULTS)) {
    for (const permissionCode of codes) {
      await repo
        .createQueryBuilder()
        .insert()
        .values({ roleId, permissionCode })
        .orIgnore()
        .execute();
    }
  }
}
