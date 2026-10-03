import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdvertisements1791016911524 implements MigrationInterface {
  name = 'AddAdvertisements1791016911524';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "advertisements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "image" character varying NOT NULL, "headline" character varying(120) NOT NULL, "subheadline" character varying, "cta" character varying(40), "link" character varying, "approved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4818a08332624787e5b2bf82302" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8561892339baa62bea991f352" ON "advertisements" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d64251e27f55d121bda8fa252" ON "advertisements" ("approved") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b3a17dd0adeba4fbb27d97730" ON "advertisements" ("userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b3a17dd0adeba4fbb27d97730"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d64251e27f55d121bda8fa252"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8561892339baa62bea991f352"`,
    );
    await queryRunner.query(`DROP TABLE "advertisements"`);
  }
}
