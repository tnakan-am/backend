import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminInvites1791020406535 implements MigrationInterface {
  name = 'AddAdminInvites1791020406535';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_79953c0faab15cd60084dc26486" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_72831aecbd755765c83f84665c" ON "admin_invites" ("tokenHash") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72831aecbd755765c83f84665c"`,
    );
    await queryRunner.query(`DROP TABLE "admin_invites"`);
  }
}
