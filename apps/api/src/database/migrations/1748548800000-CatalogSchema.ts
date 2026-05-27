import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration Sprint 2 — Catalogue MyTDFRIK.
 *
 * Crée les tables fondamentales du catalogue (CDC §3.5, §8.4) :
 *   - priority_levels (référentiel fixe seedé, 5 lignes P0-P4)
 *   - categories (catalogue éditable par Admin, soft-delete)
 *   - products (catalogue produits TECHDIFRIK, soft-delete)
 *
 * Toutes les tables disposent d'un trigger updated_at.
 */
export class CatalogSchema1748548800000 implements MigrationInterface {
  name = 'CatalogSchema1748548800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----- priority_levels -----
    await queryRunner.query(`
      CREATE TABLE "priority_levels" (
        "id" varchar(5) PRIMARY KEY,
        "label" varchar(40) NOT NULL,
        "description" text,
        "sla_first_response_minutes" integer NOT NULL,
        "sla_resolution_minutes" integer NOT NULL,
        "is_24x7" boolean NOT NULL DEFAULT false,
        CONSTRAINT "priority_levels_code_chk" CHECK ("id" IN ('P0','P1','P2','P3','P4'))
      )
    `);

    // ----- categories -----
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL,
        "label" varchar(120) NOT NULL,
        "description" text,
        "default_priority_id" varchar(5) NOT NULL,
        "requires_bug_details" boolean NOT NULL DEFAULT false,
        "default_responsible_team" varchar(80),
        "is_active" boolean NOT NULL DEFAULT true,
        "is_reserved" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "categories_priority_fk" FOREIGN KEY ("default_priority_id") REFERENCES "priority_levels" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "categories_code_idx" ON "categories" ("code") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "categories_active_idx" ON "categories" ("is_active") WHERE "deleted_at" IS NULL`,
    );

    // ----- products -----
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(40) NOT NULL,
        "label" varchar(160) NOT NULL,
        "description" text,
        "default_owner_team" varchar(80),
        "requires_os" boolean NOT NULL DEFAULT false,
        "requires_browser" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "products_code_idx" ON "products" ("code") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "products_active_idx" ON "products" ("is_active") WHERE "deleted_at" IS NULL`,
    );

    // ----- Triggers updated_at (réutilise la fonction set_updated_at créée par InitialSchema) -----
    await queryRunner.query(`
      CREATE TRIGGER categories_set_updated_at
        BEFORE UPDATE ON "categories"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
    await queryRunner.query(`
      CREATE TRIGGER products_set_updated_at
        BEFORE UPDATE ON "products"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS products_set_updated_at ON "products"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS categories_set_updated_at ON "categories"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "priority_levels"`);
  }
}
