import 'reflect-metadata';
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
 * de l'app ; pour la CLI on lit directement process.env).
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
