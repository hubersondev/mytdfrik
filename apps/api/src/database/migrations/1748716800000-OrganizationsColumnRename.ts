import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligne le nommage des colonnes de `organizations` avec le reste du schéma
 * (snake_case partout). La migration `InitialSchema` créait `organizations`
 * avec des colonnes camelCase, ce qui rendait inopérants à la fois :
 *   - les requêtes manuelles `o.deleted_at` / `o.created_at` de
 *     `OrganizationsService` (500 systématique au POST/GET)
 *   - le trigger `set_updated_at()` (qui référence `NEW.updated_at`)
 *
 * Renommer en snake_case règle les deux d'un coup et harmonise la convention
 * avec `users`, `requests`, `categories`, etc.
 */
export class OrganizationsColumnRename1748716800000 implements MigrationInterface {
  name = 'OrganizationsColumnRename1748716800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index unique qui référence "deletedAt" — à recréer avec le nouveau nom.
    await queryRunner.query(`DROP INDEX IF EXISTS "organizations_name_idx"`);

    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "externalReference" TO "external_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "addressLine" TO "address_line"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "primaryContactEmail" TO "primary_contact_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "isActive" TO "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "updatedAt" TO "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "deletedAt" TO "deleted_at"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "organizations_name_idx" ON "organizations" ("name") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "organizations_name_idx"`);

    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "deleted_at" TO "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "updated_at" TO "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "is_active" TO "isActive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "primary_contact_email" TO "primaryContactEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "address_line" TO "addressLine"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" RENAME COLUMN "external_reference" TO "externalReference"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "organizations_name_idx" ON "organizations" ("name") WHERE "deletedAt" IS NULL`,
    );
  }
}
