import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Journal des transitions de demandes (CDC §4 — Sprint 4).
 *
 * Table append-only `request_state_history` : trace immuable de chaque
 * transition (acteur, statuts, motif, événement). Les UPDATE/DELETE sont
 * rejetés par trigger, comme `audit_log`.
 */
export class RequestStateHistory1748976000000 implements MigrationInterface {
  name = 'RequestStateHistory1748976000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_state_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_id" uuid NOT NULL,
        "transition_code" varchar(20) NOT NULL,
        "from_status" varchar(40) NOT NULL,
        "to_status" varchar(40) NOT NULL,
        "actor_user_id" uuid,
        "note" text,
        "event" varchar(40) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "request_state_history_request_fk" FOREIGN KEY ("request_id") REFERENCES "requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "request_state_history_actor_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "request_state_history_request_idx" ON "request_state_history" ("request_id", "created_at")`,
    );

    // Append-only : bloque UPDATE et DELETE (réutilise le pattern d'audit_log).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION reject_request_history_mutation()
        RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'request_state_history is append-only';
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER request_state_history_block_mutation
        BEFORE UPDATE OR DELETE ON "request_state_history"
        FOR EACH ROW EXECUTE FUNCTION reject_request_history_mutation();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS request_state_history_block_mutation ON "request_state_history"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS reject_request_history_mutation()`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "request_state_history"`);
  }
}
