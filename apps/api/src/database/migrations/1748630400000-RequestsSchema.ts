import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration Sprint 3 — Demandes & brouillons.
 *
 * Tables :
 *   - requests : entité centrale du domaine (CDC §8.4.6)
 *   - request_drafts : brouillons multi-étapes du formulaire client
 *
 * Helper SQL : fonction `next_public_request_reference()` qui retourne
 * un identifiant `MTF-AAAAMMJJ-NNNN` en utilisant une séquence dédiée.
 * Le compteur NNNN repart à 0001 chaque jour (calcul date côté SQL pour
 * éviter les décalages timezone client).
 */
export class RequestsSchema1748630400000 implements MigrationInterface {
  name = 'RequestsSchema1748630400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----- Séquence + fonction de génération d'identifiant public -----
    //
    // On garde une **table compteur** par date plutôt qu'une séquence Postgres
    // monotone : ça permet de reset NNNN à chaque jour sans manipulation
    // manuelle des séquences (qui sont globales et non transactionnelles).
    await queryRunner.query(`
      CREATE TABLE "request_reference_counters" (
        "day" date PRIMARY KEY,
        "counter" integer NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION next_public_request_reference()
        RETURNS varchar AS $$
      DECLARE
        v_day date := (now() AT TIME ZONE 'UTC')::date;
        v_counter integer;
      BEGIN
        INSERT INTO "request_reference_counters" ("day", "counter")
          VALUES (v_day, 1)
          ON CONFLICT ("day") DO UPDATE
            SET "counter" = "request_reference_counters"."counter" + 1
          RETURNING "counter" INTO v_counter;

        RETURN 'MTF-'
          || to_char(v_day, 'YYYYMMDD')
          || '-'
          || lpad(v_counter::text, 4, '0');
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ----- requests -----
    await queryRunner.query(`
      CREATE TABLE "requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "public_reference" varchar(20) NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "impact" varchar(20) NOT NULL,
        "urgency" varchar(20) NOT NULL,
        "client_context_note" varchar(500),
        "system_priority_id" varchar(5) NOT NULL,
        "effective_priority_id" varchar(5) NOT NULL,
        "priority_override_reason" text,
        "status" varchar(40) NOT NULL DEFAULT 'NOUVELLE',
        "previous_status_before_wait" varchar(40),
        "assigned_to_user_id" uuid,
        "assigned_by_user_id" uuid,
        "qualified_by_user_id" uuid,
        "reopen_count" smallint NOT NULL DEFAULT 0,
        "cancellation_reason" text,
        "rejection_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "qualified_at" timestamptz,
        "first_response_at" timestamptz,
        "resolved_at" timestamptz,
        "closed_at" timestamptz,
        "last_reopened_at" timestamptz,
        "waiting_client_total_ms" bigint NOT NULL DEFAULT 0,
        "sla_due_first_response_at" timestamptz,
        "sla_due_resolution_at" timestamptz,
        "is_sla_first_response_respected" boolean,
        "is_sla_resolution_respected" boolean,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "requests_impact_chk" CHECK ("impact" IN ('BLOCAGE_TOTAL','BLOCAGE_PARTIEL','DEGRADATION','AUCUN_IMPACT')),
        CONSTRAINT "requests_urgency_chk" CHECK ("urgency" IN ('CRITIQUE','ELEVEE','MODEREE','FAIBLE')),
        CONSTRAINT "requests_status_chk" CHECK ("status" IN ('NOUVELLE','EN_ATTENTE_AFFECTATION','AFFECTEE','EN_COURS','EN_ATTENTE_CLIENT','RESOLUE','CLOTUREE','ANNULEE')),
        CONSTRAINT "requests_created_by_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id"),
        CONSTRAINT "requests_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id"),
        CONSTRAINT "requests_category_fk" FOREIGN KEY ("category_id") REFERENCES "categories" ("id"),
        CONSTRAINT "requests_system_priority_fk" FOREIGN KEY ("system_priority_id") REFERENCES "priority_levels" ("id"),
        CONSTRAINT "requests_effective_priority_fk" FOREIGN KEY ("effective_priority_id") REFERENCES "priority_levels" ("id"),
        CONSTRAINT "requests_assigned_to_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users" ("id"),
        CONSTRAINT "requests_assigned_by_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users" ("id"),
        CONSTRAINT "requests_qualified_by_fk" FOREIGN KEY ("qualified_by_user_id") REFERENCES "users" ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "requests_public_ref_idx" ON "requests" ("public_reference")`,
    );
    await queryRunner.query(
      `CREATE INDEX "requests_status_priority_created_idx" ON "requests" ("status", "effective_priority_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "requests_organization_created_idx" ON "requests" ("organization_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "requests_assigned_status_idx" ON "requests" ("assigned_to_user_id", "status")`,
    );

    // Trigger updated_at (réutilise la fonction set_updated_at créée par InitialSchema)
    await queryRunner.query(`
      CREATE TRIGGER requests_set_updated_at
        BEFORE UPDATE ON "requests"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ----- request_drafts -----
    await queryRunner.query(`
      CREATE TABLE "request_drafts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "owner_user_id" uuid NOT NULL,
        "payload" jsonb NOT NULL,
        "step" smallint NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "request_drafts_owner_fk" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "request_drafts_owner_idx" ON "request_drafts" ("owner_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "request_drafts_updated_idx" ON "request_drafts" ("updated_at")`,
    );
    await queryRunner.query(`
      CREATE TRIGGER request_drafts_set_updated_at
        BEFORE UPDATE ON "request_drafts"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS request_drafts_set_updated_at ON "request_drafts"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS requests_set_updated_at ON "requests"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "request_drafts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "requests"`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS next_public_request_reference()`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "request_reference_counters"`,
    );
  }
}
