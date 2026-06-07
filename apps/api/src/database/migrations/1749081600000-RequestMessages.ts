import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Messagerie des demandes (CDC §3.7, §8.4.10 — Sprint 6).
 *
 * Table `request_messages` : messages partagés Client / Gestionnaire /
 * Responsable, avec messages internes (non visibles du Client) et retrait
 * (le corps reste en base pour l'audit ; pas de suppression).
 */
export class RequestMessages1749081600000 implements MigrationInterface {
  name = 'RequestMessages1749081600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_id" uuid NOT NULL,
        "author_user_id" uuid NOT NULL,
        "body" text NOT NULL,
        "is_internal" boolean NOT NULL DEFAULT false,
        "is_withdrawn" boolean NOT NULL DEFAULT false,
        "withdrawn_at" timestamptz,
        "withdrawal_reason" varchar(300),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "request_messages_request_fk" FOREIGN KEY ("request_id") REFERENCES "requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "request_messages_author_fk" FOREIGN KEY ("author_user_id") REFERENCES "users" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "request_messages_request_idx" ON "request_messages" ("request_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "request_messages"`);
  }
}
