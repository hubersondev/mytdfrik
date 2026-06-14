import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute à une organisation un responsable par défaut optionnel : utilisateur
 * interne (ADMIN ou RESPONSABLE) à qui les nouvelles demandes de l'organisation
 * sont affectées automatiquement à la création (affectation directe).
 *
 * FK ON DELETE SET NULL : si le responsable est supprimé, l'organisation
 * retombe simplement en file de qualification normale.
 */
export class OrganizationDefaultAssignee1749427200000 implements MigrationInterface {
  name = 'OrganizationDefaultAssignee1749427200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD COLUMN "default_assignee_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "organizations_default_assignee_fk" FOREIGN KEY ("default_assignee_user_id") REFERENCES "users" ("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "organizations_default_assignee_idx" ON "organizations" ("default_assignee_user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "organizations_default_assignee_idx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_default_assignee_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "default_assignee_user_id"`,
    );
  }
}
