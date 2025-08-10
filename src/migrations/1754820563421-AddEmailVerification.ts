import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1754820563421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "verified" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "verificationToken" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verificationToken"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verified"`);
  }
}
