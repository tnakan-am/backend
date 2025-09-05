import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdForeignKey1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if the foreign key already exists
    const foreignKeys = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'address' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'FK_address_userId'
    `);
    
    // If foreign key doesn't exist, create it
    if (foreignKeys.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "address" 
        ADD CONSTRAINT "FK_address_userId" 
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "address" 
      DROP CONSTRAINT IF EXISTS "FK_address_userId"
    `);
  }
}