import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1749340800000 implements MigrationInterface {
  name = 'Notifications1749340800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_code" varchar(80) NOT NULL,
        "request_id" uuid,
        "recipient_user_id" uuid NOT NULL,
        "payload" jsonb NOT NULL,
        "is_critical" boolean NOT NULL DEFAULT false,
        "is_read_in_app" boolean NOT NULL DEFAULT false,
        "read_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "notifications_request_fk" FOREIGN KEY ("request_id") REFERENCES "requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "notifications_recipient_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "notifications_recipient_unread_idx" ON "notifications" ("recipient_user_id", "is_read_in_app", "created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "notification_deliveries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "notification_id" uuid NOT NULL,
        "channel" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "attempts" smallint NOT NULL DEFAULT 0,
        "last_attempt_at" timestamptz,
        "error_message" text,
        "provider_message_id" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "notification_deliveries_notification_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "notification_deliveries_notification_idx" ON "notification_deliveries" ("notification_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_deliveries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
