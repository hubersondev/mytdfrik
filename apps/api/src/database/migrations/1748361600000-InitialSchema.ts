import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration initiale MyTDFRIK — Sprint 1.
 *
 * Crée les tables fondamentales (auth, audit, organisations, utilisateurs)
 * conformément à CDC §8.4.
 *
 * Tables introduites :
 *   - organizations
 *   - roles (référentiel fixe seedé)
 *   - users
 *   - sessions
 *   - password_reset_tokens
 *   - account_activation_tokens
 *   - audit_log (append-only, jamais purgé via migration)
 */
export class InitialSchema1748361600000 implements MigrationInterface {
  name = 'InitialSchema1748361600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensions PostgreSQL nécessaires (UUID, recherche texte)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ----- organizations -----
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "externalReference" varchar(80),
        "addressLine" varchar(200),
        "city" varchar(120),
        "country" varchar(80),
        "primaryContactEmail" varchar(254),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "organizations_name_idx" ON "organizations" ("name") WHERE "deletedAt" IS NULL`,
    );

    // ----- roles -----
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" varchar(20) PRIMARY KEY,
        "label" varchar(80) NOT NULL,
        "description" text
      )
    `);

    // ----- users -----
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(254) NOT NULL,
        "email_status" varchar(10) NOT NULL DEFAULT 'VALID',
        "password_hash" varchar(255) NOT NULL,
        "first_name" varchar(120) NOT NULL,
        "last_name" varchar(120) NOT NULL,
        "phone" varchar(40),
        "avatar_url" varchar(500),
        "role_id" varchar(20) NOT NULL,
        "organization_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "locked_until" timestamptz,
        "failed_login_count" smallint NOT NULL DEFAULT 0,
        "last_login_at" timestamptz,
        "last_password_changed_at" timestamptz,
        "time_zone" varchar(64) NOT NULL DEFAULT 'Africa/Abidjan',
        "notification_preferences" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "users_role_fk" FOREIGN KEY ("role_id") REFERENCES "roles" ("id"),
        CONSTRAINT "users_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id"),
        CONSTRAINT "users_client_requires_org" CHECK ("role_id" <> 'CLIENT' OR "organization_id" IS NOT NULL)
      )
    `);

    // Email unique insensible à la casse, en excluant les comptes soft-deleted (CDC §8.4.3 [EXG-08-011])
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" (LOWER("email")) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "users_role_active_idx" ON "users" ("role_id", "is_active") WHERE "deleted_at" IS NULL`,
    );

    // ----- sessions (refresh tokens hashés) -----
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" varchar(128) NOT NULL,
        "client_ip" varchar(64),
        "user_agent" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "last_used_at" timestamptz,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        CONSTRAINT "sessions_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" ("refresh_token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "sessions_active_idx" ON "sessions" ("user_id", "revoked_at") WHERE "revoked_at" IS NULL`,
    );

    // ----- password_reset_tokens -----
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(128) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        CONSTRAINT "password_reset_tokens_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "password_reset_tokens_hash_idx" ON "password_reset_tokens" ("token_hash")`,
    );

    // ----- account_activation_tokens -----
    await queryRunner.query(`
      CREATE TABLE "account_activation_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(128) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        CONSTRAINT "account_activation_tokens_user_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "account_activation_tokens_user_idx" ON "account_activation_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "account_activation_tokens_hash_idx" ON "account_activation_tokens" ("token_hash")`,
    );

    // ----- audit_log (append-only) -----
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" bigserial PRIMARY KEY,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        "actor_user_id" uuid,
        "actor_role" varchar(20),
        "action_code" varchar(80) NOT NULL,
        "object_type" varchar(40) NOT NULL,
        "object_id" varchar(80),
        "payload" jsonb,
        "client_ip" varchar(64),
        "user_agent" varchar(500),
        "request_id_correlation" varchar(80)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "audit_log_occurred_at_idx" ON "audit_log" ("occurred_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "audit_log_actor_idx" ON "audit_log" ("actor_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "audit_log_object_idx" ON "audit_log" ("object_type", "object_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "audit_log_action_idx" ON "audit_log" ("action_code")`,
    );

    // ----- Protection append-only sur audit_log (CDC §10.6 [EXG-10-111]) -----
    // Refuse explicitement UPDATE et DELETE via un trigger BEFORE.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION reject_audit_log_mutation()
        RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'audit_log est en mode append-only — opération % refusée', TG_OP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER audit_log_block_update
        BEFORE UPDATE OR DELETE ON "audit_log"
        FOR EACH ROW EXECUTE FUNCTION reject_audit_log_mutation();
    `);

    // ----- Trigger d'update du champ updated_at -----
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER users_set_updated_at
        BEFORE UPDATE ON "users"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
    await queryRunner.query(`
      CREATE TRIGGER organizations_set_updated_at
        BEFORE UPDATE ON "organizations"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS organizations_set_updated_at ON "organizations"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS users_set_updated_at ON "users"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS audit_log_block_update ON "audit_log"`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at()`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS reject_audit_log_mutation()`,
    );

    // Tables (ordre inverse pour respecter les FK)
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account_activation_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
  }
}
