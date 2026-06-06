import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * RBAC dynamique (ADR-004).
 *
 * Fait évoluer la table `roles` (jusqu'ici référentiel fixe de 5 lignes) vers
 * un référentiel éditable, et introduit `role_permissions` (attribution des
 * permissions du catalogue figé aux rôles).
 *
 * - `roles` : ajout de `scope`, `is_system`, `is_active`, timestamps + soft-delete.
 *   Backfill : ADMIN → INTERNAL + système ; CLIENT → CLIENT ; les 3 autres → INTERNAL.
 * - `role_permissions` : (role_id, permission_code). L'ADMIN n'a pas de ligne
 *   (bypass total côté guard).
 *
 * L'attribution des permissions par défaut à chaque rôle est faite par le seed
 * (idempotent), pas par la migration.
 */
export class RbacDynamicSchema1748889600000 implements MigrationInterface {
  name = 'RbacDynamicSchema1748889600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----- roles : nouvelles colonnes -----
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "scope" varchar(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "is_system" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN "deleted_at" timestamptz`,
    );

    // Backfill scope + système sur les rôles existants
    await queryRunner.query(
      `UPDATE "roles" SET "scope" = 'CLIENT' WHERE "id" = 'CLIENT'`,
    );
    await queryRunner.query(
      `UPDATE "roles" SET "scope" = 'INTERNAL' WHERE "id" IN ('GESTIONNAIRE','RESPONSABLE','ADMIN','DG')`,
    );
    await queryRunner.query(
      `UPDATE "roles" SET "is_system" = true WHERE "id" = 'ADMIN'`,
    );
    // Filet de sécurité pour d'éventuelles lignes hors socle
    await queryRunner.query(
      `UPDATE "roles" SET "scope" = 'INTERNAL' WHERE "scope" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ALTER COLUMN "scope" SET NOT NULL`,
    );

    // Trigger updated_at (réutilise la fonction set_updated_at de InitialSchema)
    await queryRunner.query(`
      CREATE TRIGGER roles_set_updated_at
        BEFORE UPDATE ON "roles"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ----- role_permissions -----
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" varchar(20) NOT NULL,
        "permission_code" varchar(60) NOT NULL,
        CONSTRAINT "role_permissions_pk" PRIMARY KEY ("role_id", "permission_code"),
        CONSTRAINT "role_permissions_role_fk" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "role_permissions_role_idx" ON "role_permissions" ("role_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS roles_set_updated_at ON "roles"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "is_system"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "scope"`,
    );
  }
}
