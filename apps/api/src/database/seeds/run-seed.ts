import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { AppDataSource } from '../data-source';
import { seedAdminBootstrap } from './admin-bootstrap.seed';
import { seedRoles } from './roles.seed';

/**
 * Lance tous les seeds idempotents dans l'ordre.
 * Usage : pnpm --filter @mytdfrik/api seed
 */
async function main(): Promise<void> {
  loadEnv();

  console.log('[seed] Initialisation du DataSource…');
  await AppDataSource.initialize();

  try {
    console.log('[seed] Seeding des rôles…');
    await seedRoles(AppDataSource);

    console.log("[seed] Seeding de l'admin bootstrap…");
    await seedAdminBootstrap(AppDataSource);

    console.log('[seed] Terminé avec succès.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error('[seed] Échec :', error);
  process.exit(1);
});
