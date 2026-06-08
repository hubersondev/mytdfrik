import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequestAttachments1749168000000 implements MigrationInterface {
  name = 'RequestAttachments1749168000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "request_attachments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "request_id" uuid NOT NULL,
        "message_id" uuid,
        "uploaded_by_user_id" uuid NOT NULL,
        "original_filename" varchar(255) NOT NULL,
        "mime_type" varchar(120) NOT NULL,
        "size_bytes" bigint NOT NULL,
        "storage_bucket" varchar(120) NOT NULL,
        "storage_key" varchar(500) NOT NULL,
        "storage_etag" varchar(120),
        "antivirus_status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "antivirus_checked_at" timestamptz,
        "is_withdrawn" boolean NOT NULL DEFAULT false,
        "withdrawal_reason" varchar(300),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "request_attachments_request_fk" FOREIGN KEY ("request_id") REFERENCES "requests" ("id") ON DELETE CASCADE,
        CONSTRAINT "request_attachments_message_fk" FOREIGN KEY ("message_id") REFERENCES "request_messages" ("id") ON DELETE CASCADE,
        CONSTRAINT "request_attachments_uploader_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "request_attachments_request_idx" ON "request_attachments" ("request_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "request_attachments"`);
  }
}
