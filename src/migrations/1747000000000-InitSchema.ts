import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1747000000000 implements MigrationInterface {
  name = 'InitSchema1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    // The actual table DDL is emitted via TypeORM `synchronize` in dev.
    // This migration only ensures the UUID functions are available so that
    // either `synchronize` or a generated migration can create uuid columns.
  }

  public async down(): Promise<void> {
    // Extensions are left in place — they are harmless and may be shared.
  }
}
