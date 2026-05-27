import 'reflect-metadata';
// Charge le fichier .env le plus proche (apps/api/.env quand on lance pnpm depuis apps/api,
// puis la racine du monorepo en repli). Indispensable pour les commandes CLI TypeORM qui
// exécutent ce module sans passer par NestJS ConfigModule.
import * as dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const candidate of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
]) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

import { DataSource, DataSourceOptions } from 'typeorm';
import {
  AccountActivationToken,
  AuditLog,
  Organization,
  PasswordResetToken,
  Role,
  Session,
  User,
} from './entities';

/**
 * Configuration TypeORM partagée par l'application NestJS et la CLI de migrations.
 *
 * Usage CLI :
 *   pnpm typeorm migration:generate src/database/migrations/Nom -d src/database/data-source.ts
 *   pnpm typeorm migration:run -d src/database/data-source.ts
 *   pnpm typeorm migration:revert -d src/database/data-source.ts
 *
 * Le DATABASE_URL est lu depuis l'env (validé par config.schema.ts au démarrage
 * de l'app ; pour la CLI on lit directement process.env via dotenv ci-dessus).
 */
export const buildDataSourceOptions = (
  databaseUrl?: string,
): DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl ?? process.env.DATABASE_URL,
  entities: [
    AccountActivationToken,
    AuditLog,
    Organization,
    PasswordResetToken,
    Role,
    Session,
    User,
  ],
  migrations: ['src/database/migrations/*.ts', 'dist/database/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
  synchronize: false,
  logging:
    process.env.NODE_ENV === 'development'
      ? ['error', 'warn', 'migration']
      : ['error'],
});

export const AppDataSource = new DataSource(buildDataSourceOptions());
