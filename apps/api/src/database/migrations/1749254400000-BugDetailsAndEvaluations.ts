import { MigrationInterface, QueryRunner } from 'typeorm';

export class BugDetailsAndEvaluations1749254400000 implements MigrationInterface {
  name = 'BugDetailsAndEvaluations1749254400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_bug_details" (
        "request_id" uuid PRIMARY KEY,
        "product_id" uuid NOT NULL,
        "product_version" varchar(60) NOT NULL,
        "expected_behavior" text NOT NULL,
        "observed_behavior" text NOT NULL,
        "reproduction_steps" text NOT NULL,
        "occurred_at" timestamptz NOT NULL,
        "is_recurrent" boolean NOT NULL,
        "frequency_label" varchar(40),
        "environment_os" varchar(120),
        "environment_browser" varchar(120),
        "environment_hardware" varchar(300),
        "is_blocking" boolean NOT NULL,
        "error_messages" text,
        "is_reproduced" varchar(20),
        "root_cause" text,
        "corrective_action" text,
        "workaround" text,
        "fix_deployed" boolean,
        "workaround_only" boolean,
        "is_knowledge_base_eligible" boolean NOT NULL DEFAULT false,
        "external_tracker_ref" varchar(300),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "request_bug_details_request_fk" FOREIGN KEY ("request_id") REFERENCES "requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "request_bug_details_product_fk" FOREIGN KEY ("product_id") REFERENCES "products" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "evaluations" (
        "request_id" uuid PRIMARY KEY,
        "score" smallint NOT NULL,
        "comment" text,
        "submitted_by_user_id" uuid NOT NULL,
        "submitted_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "evaluations_score_chk" CHECK ("score" BETWEEN 1 AND 5),
        CONSTRAINT "evaluations_request_fk" FOREIGN KEY ("request_id") REFERENCES "requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "evaluations_user_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users" ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "evaluations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "request_bug_details"`);
  }
}
