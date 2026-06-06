import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Référentiel géographique — tables `countries` et `cities` (CDC §8.4.1).
 *
 * Objectif : remplacer la saisie libre de la ville et du pays sur une
 * organisation par un choix dans des référentiels normalisés.
 *
 * - `countries` : pays (ISO 3166-1 alpha-2), seedé (CEDEAO + pays fréquents).
 * - `cities` : villes rattachées à un pays (FK), seedées (communes de CI + voisins).
 * - `organizations` : les colonnes texte `city` / `country` sont remplacées par
 *   les FK `city_id` / `country_id`. Les valeurs texte existantes (données de
 *   test du S3) ne sont pas migrées — elles sont supprimées avec les colonnes.
 *
 * Toutes les tables disposent d'un trigger updated_at (fonction set_updated_at
 * créée par InitialSchema).
 */
export class GeoReferenceSchema1748803200000 implements MigrationInterface {
  name = 'GeoReferenceSchema1748803200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----- countries -----
    await queryRunner.query(`
      CREATE TABLE "countries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(2) NOT NULL,
        "name" varchar(80) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "countries_code_idx" ON "countries" ("code") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "countries_active_idx" ON "countries" ("is_active") WHERE "deleted_at" IS NULL`,
    );

    // ----- cities -----
    await queryRunner.query(`
      CREATE TABLE "cities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "country_id" uuid NOT NULL,
        "name" varchar(120) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "cities_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "cities_country_name_idx" ON "cities" ("country_id", "name") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "cities_active_idx" ON "cities" ("is_active") WHERE "deleted_at" IS NULL`,
    );

    // ----- Triggers updated_at -----
    await queryRunner.query(`
      CREATE TRIGGER countries_set_updated_at
        BEFORE UPDATE ON "countries"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
    await queryRunner.query(`
      CREATE TRIGGER cities_set_updated_at
        BEFORE UPDATE ON "cities"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ----- organizations : city/country (texte) -> city_id/country_id (FK) -----
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "city"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "country"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "country_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "city_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "organizations_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries" ("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "organizations_city_fk" FOREIGN KEY ("city_id") REFERENCES "cities" ("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "organizations_country_idx" ON "organizations" ("country_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "organizations_city_idx" ON "organizations" ("city_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaure les colonnes texte sur organizations
    await queryRunner.query(`DROP INDEX IF EXISTS "organizations_city_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "organizations_country_idx"`);
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_city_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_country_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "city_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "country_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "city" varchar(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "country" varchar(80)`,
    );

    await queryRunner.query(
      `DROP TRIGGER IF EXISTS cities_set_updated_at ON "cities"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS countries_set_updated_at ON "countries"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "cities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "countries"`);
  }
}
