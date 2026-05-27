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

import { join } from 'node:path';
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
 *   pnpm migration:generate src/database/migrations/Nom -d src/database/data-source.ts
 *   pnpm migration:run -d src/database/data-source.ts
 *   pnpm migration:revert -d src/database/data-source.ts
 *
 * Le DATABASE_URL est lu depuis l'env (validé par config.schema.ts au démarrage
 * de l'app ; pour la CLI on lit directement process.env via dotenv ci-dessus).
 *
 * Discrimination .ts/.js : on regarde l'extension réelle du fichier compilé.
 * - Sous ts-node (CLI dev) : __filename = data-source.ts → on charge migrations/*.ts
 * - Sous Node compilé (nest start, prod) : __filename = data-source.js → on charge migrations/*.js
 * Évite l'erreur "Cannot require() ES Module ... .ts" sous NestJS dev/prod.
 */
const isTypeScriptRuntime = __filename.endsWith('.ts');
const migrationsGlob = isTypeScriptRuntime
  ? join(__dirname, 'migrations', '*.ts')
  : join(__dirname, 'migrations', '*.js');

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
  migrations: [migrationsGlob],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
  synchronize: false,
  logging:
    process.env.NODE_ENV === 'development'
      ? ['error', 'warn', 'migration']
      : ['error'],
});

export const AppDataSource = new DataSource(buildDataSourceOptions());
