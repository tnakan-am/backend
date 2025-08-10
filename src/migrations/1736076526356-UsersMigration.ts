import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class UsersMigration1736076526356 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Create custom enum type
    await queryRunner.query(`
            CREATE TYPE user_type_enum AS ENUM ('buyer', 'seller', 'admin');
        `);

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'fullName',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'user_type_enum',
          },
          {
            name: 'verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_FULLNAME',
        columnNames: ['fullName'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.dropTable('users');

    // Drop enum type
    await queryRunner.query(`
            DROP TYPE IF EXISTS user_type_enum;
        `);
  }
}
